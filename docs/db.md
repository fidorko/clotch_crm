# DB

PostgreSQL 16 (Docker Compose, локально) + Drizzle ORM. Схема: `src/server/db/schema/*.ts`. Міграції: `drizzle/migrations/` (генеруються, комітяться в git, ніколи не редагуються вручну заднім числом).

## Мультитенантність (розділ 6 CLAUDE.md) — як дотримано

1. **`tenant_id` на кожній прикладній таблиці.** Єдиний виняток — `tenants` (сам довідник тенантів, глобальна таблиця за визначенням).
2. **Два незалежні рубежі захисту:**
   - Перший — явний `WHERE tenant_id = ...` у кожному запиті data-access шару (`src/server/data/*`).
   - Другий — PostgreSQL Row-Level Security: усі прикладні таблиці мають `ENABLE ROW LEVEL SECURITY` + політику `tenant_isolation` (`src/server/db/schema/rls.ts`), що звіряє `tenant_id` із сесійною змінною `app.tenant_id`.
3. **`tenant_id` — тільки з сервера.** Наразі немає авторизації/сесій, тому джерело тимчасове: `src/server/tenant/get-tenant-id.ts` (`DEV_TENANT_ID` з `.env`, позначено `TODO(auth)`). Клієнт (URL, форма) `tenant_id` ніколи не передає.
4. **Композитні індекси tenant_id-перші** — усюди, де є частий `WHERE`/`ORDER BY` (див. таблиці нижче).
5. **UNIQUE у межах тенанта** — `products (tenant_id, model_code)`, `product_skus (tenant_id, code)`, `product_skus (tenant_id, barcode)` (частковий, ігнорує `NULL`), `tags (tenant_id, label)`.
6. **Єдиний шар доступу** — `src/server/data/products.ts`. Усі функції приймають `tenantId` як обов'язковий типізований параметр; виклик без нього не компілюється.
7. **Перевірка належності перед дією** — кожен запит фільтрує і за `tenant_id`, і за `id`; чужий `id` під чужим `tenant_id` повертає `null`, а не помилку (перевірено, див. «Перевірка ізоляції» нижче).
8. **Суперадмін** — не реалізовано (немає авторизації взагалі), окремий шлях буде спроєктовано разом з ролями.

### Чому RLS реально працює, а не просто присутня в схемі
Власник таблиці (роль, якою котяться міграції — `DATABASE_URL`) обходить RLS за замовчуванням у Postgres. Тому застосунок підключається окремою **non-owner** роллю `app_user` (`APP_DATABASE_URL`), без прав власника, з явними `GRANT SELECT/INSERT/UPDATE/DELETE`. Роль створюється ідемпотентним скриптом `npm run db:setup-role` (`src/server/db/setup-app-role.ts`) — не вручну, щоб крок був відтворюваний на іншій машині/середовищі.

`src/server/db/client.ts` → `withTenant(tenantId, fn)` — єдина точка входу для тенант-скоупованих запитів: у транзакції виконує `set_config('app.tenant_id', tenantId, true)` (транзакційно, як `SET LOCAL`), потім викликає `fn`. RLS-політика читає це значення через `current_setting('app.tenant_id', true)::uuid` (`missing_ok = true` — якщо не виставлено, `NULL`, порівняння хибне, доступ забороняється).

**Fail-closed, перевірено:**
- Запит під власним `tenant_id` → дані повертаються.
- Той самий запит (той самий `id`) під чужим `tenant_id` → `null`/0 рядків.
- Пряме `SELECT` від `app_user` без `WHERE tenant_id` узагалі (перевірка, що RLS сама відсікає, незалежно від коду застосунку) — 0 рядків для чужого `app.tenant_id`, весь тенантний набір для свого.
- Якщо `app.tenant_id` не виставлено в сесії жодного разу — `current_setting(..., true)` повертає `NULL`, доступ заборонено. Якщо змінну виставляли раніше в тій самій сесії (інша транзакція) і не виставили в поточній — Postgres може повернути порожній рядок `''` для custom-GUC-плейсхолдера, і каст до `uuid` впаде з помилкою замість порожнього результату. Це теж fail-closed (дані не витікають), просто явна помилка замість тихої порожньої відповіді — у проді таке означає баг у виклику (забули `withTenant`), не витік.

## Таблиці

### tenants (глобальна, виняток із правила tenant_id)
| Поле | Тип | Коментар |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| created_at | timestamptz | |

Мінімальний склад навмисно — авторизації й керування тенантами ще немає.

### products
Плоскі колонки (не jsonb) для `info.*`/`meta.*`/`pricing` — набір полів фіксований, не тенант-конфігурований, і потрібні звичайні `WHERE`/`ORDER BY`/індекси (ціна, статус, дата) — jsonb ускладнив би і те, і те без вигоди. Див. `decisions.md`.

Ключові поля: `category` (коротка назва) + `category_path` (повний ієрархічний шлях — раніше `info.category` в TS-типі, тепер розведено на дві колонки, `breadcrumb` не зберігається — рахується на рендері з `category` + `name`). Ціни — 4 канали (`retail`/`wholesale`/`dropship`/`retail_discount`), кожен `mode` + `amount` + `percent` (обидва значення зберігаються завжди, перемикач лише обирає активне — UI-патерн з `ProductInfoPanel`).

`category_id` (uuid, nullable) — реальний FK на `categories.id`, `ON DELETE SET NULL` (на відміну від `categories.parent_id`, де `RESTRICT` — тут інша семантика: видалення категорії не повинно блокуватись через товари, товар просто лишається без категорії). `category`/`category_path` — окремі, свідомо НЕ синхронізуються автоматично з обраною `category_id` (лишаються як були, для хлібних крихт і т. ін.) — відомий розрив, зафіксований нижче.

Індекси: `(tenant_id, created_at)`, `(tenant_id, status)`, `(tenant_id, category_id)` (під `GROUP BY category_id` для лічильника товарів на категорію). UNIQUE: `(tenant_id, model_code)` — модель-код унікальний у межах тенанта (підтверджено).

**`supplier_id` (uuid, nullable) — реальний FK на `suppliers.id`, `ON DELETE SET NULL`** (той самий патерн, що `category_id`). Замінив вільнотекстову колонку `supplier` (видалено). Дві окремі міграції (`0010` — DROP `supplier`, `0011` — ADD `supplier_id`), щоб `drizzle-kit generate` не розпізнав це як перейменування колонки в одному проході (та сама гочта, що з таблицями — `product_color_photos`, вище) — non-interactive shell не може відповісти на інтерактивний prompt.

### product_skus
`tenant_id`, `product_id` (FK `ON DELETE CASCADE`), `code`, `color`, `color_hex`, `size`, `barcode`, `stock` (CHECK `>= 0`), `cell`. Плюс 6 nullable `*_override` полів (грн, без `mode`/`percent` — SKU-панель має лише резолвнуту суму) — override не прив'язаний до окремого запису історії, `NULL` = успадковує ціну товару.

Індекси: `(tenant_id, product_id)`. UNIQUE: `(tenant_id, code)`, частковий `(tenant_id, barcode) WHERE barcode IS NOT NULL` (порожній штрихкод — легальний проміжний стан у конструкторі SKU-матриці, не повинен конфліктувати сам із собою).

**Відомий розрив, не виправлений навмисно:** TS-тип `ProductSku.cell` — одна комірка (текст), тоді як мок `selectedSku.cells` показує розбивку залишку по кількох комірках з кількістю (`[{code, qty}]`). Перший прохід БД лишає одну комірку на SKU, 1:1 з поточним типом. Багатокомірковість — окреме рішення, коли знадобиться складський модуль.

### product_photos
`tenant_id`, `product_id` (CASCADE), `url`, `alt`, `position` (порядок, перше фото — головне). Індекс `(tenant_id, product_id, position)`. Реальний файловий аплоад (не `blob:`-прев'ю) — `ProductPhotoGallery`, деталі в розділі «Файлове сховище» нижче.

### product_color_photos
`tenant_id`, `product_id` (FK `products.id`, CASCADE), `color` (вільний текст — та сама копія значення, що й `product_skus.color`, **не FK**), `url`, `position`. Індекс `(tenant_id, product_id, color, position)`.

**Фото прив'язане до кольору товару, не до окремого SKU.** На один колір завжди припадає кілька SKU (по одному на кожен розмір), і фото моделі в цьому кольорі однакове для всіх розмірів — прив'язка до `sku_id` (перший варіант цієї таблиці, `product_sku_photos`, замінений цією) змусила б завантажувати те саме фото окремо на кожен розмір і не показувала б його для розмірів, ще не доданих у матрицю. Наслідок: фото можна завантажити для кольору ще до того, як для нього створено хоч один SKU (немає залежності від `product_skus` узагалі, лише від `products.id` + вільний текст `color`) — і воно **не** каскадиться автоматично при видаленні SKU чи навіть цілого кольору з матриці (`color` не FK, FK тут лише на `product_id`). Видалення кольору цілком (`ProductSkuTable` → кошик біля назви кольору) тому явно чистить і фото цього кольору окремим запитом (`deleteColorPhotosByColor` + `deleteColorPhotosAction`), а не покладається на каскад.

Ліміт 3 фото на колір — **не** DB-constraint, перевіряється в Server Action (`uploadColorPhotoAction`) до збереження файлу на диск, щоб при відмові не лишати «осиротілий» файл.

### product_measurements
`tenant_id`, `product_id` (CASCADE), `type` (вільний текст, копія лейбла з `lib/constants/measurement-types.ts` — **не FK**, довідник типів замірів свідомо не нормалізований, див. нижче), `value_cm`. Індекс `(tenant_id, product_id)`.

### tags / product_tags
`tags` — нормалізований довідник, тенантний, `UNIQUE (tenant_id, label)`. `product_tags` — junction, `tenant_id` тут навмисно **денормалізований** (виводиться з `product_id`/`tag_id`), щоб буквально виконати правило «кожна прикладна таблиця має tenant_id» і щоб RLS-політика не залежала від join. Індекс `(tenant_id, tag_id)`.

### categories
Ієрархія категорій вітрини (модуль `settings`, вкладка «Категорії товару»): `tenant_id`, `parent_id` (самопосилання на `categories.id`, `NULL` = коренева), `name`, `description`, `image_url`, `is_active` («Активна на вітрині»), `show_in_storefront_section`, `show_in_header_menu`, `default_weight_kg`/`default_length_cm`/`default_width_cm`/`default_height_cm` (підставляються товару категорії, якщо там не вказано своє), `seo_h1`/`seo_meta_title`/`seo_meta_description`, `position` (для майбутнього drag-and-drop сортування — колонка є, сама функція сортування в UI ще не зроблена).

Індекси: `(tenant_id, parent_id)`, `(tenant_id, created_at)`. **UNIQUE на `name` навмисно нема** (не підтверджено з людиною, чи назва категорії унікальна навіть у межах тенанта — на відміну від `products.model_code`, де це підтверджено).

**`parent_id` — `ON DELETE RESTRICT`, не `SET NULL`/`CASCADE`.** Видалення категорії з дочірніми — заборонено на рівні самої БД (Postgres відхиляє DELETE, поки є діти), а не лише перевіркою в коді — так це діє, навіть якщо колись з'явиться інший шлях запису повз `src/server/data/categories.ts`. Захист від **циклу** в ієрархії (категорія стає батьком власного нащадка) — окрема перевірка в `updateCategoryAction` (`src/lib/categories/tree.ts` → `isDescendantCategory`), бо сам FK цього не ловить (це не рекурсивний CHECK).

**`products.category_id → categories.id` — підключено** (раніше цього розділу не було, товари й категорії були не пов'язані; тепер FK є, і колонка «Товарів» у таблиці категорій рахує реальні дані через `getProductCountsByCategory` — `GROUP BY category_id`, без N+1, і рекурсивно сумується по дереву на клієнті для батьківських категорій). `category`/`category_path` (вільний текст) при цьому **не оновлюються** автоматично при виборі `category_id` — два джерела даних про категорію товару поки існують паралельно, не синхронізовано. Це свідомий, обмежений за часом компроміс (не просили синхронізувати текстові поля), а не забута робота — але вартий уваги, якщо десь використовується `product.category`/`categoryPath` для відображення (напр. хлібні крихти `ProductHeader`) і очікується, що воно відповідає реально обраній категорії.

**Гочта Drizzle, яку ловили на цій таблиці:** коли `tx.delete(...)` падає через FK-порушення, Drizzle обгортає сиру помилку `postgres.js` у `DrizzleQueryError` — реальний Postgres-код (`error.code`, напр. `'23503'`) лежить у **`error.cause.code`**, не в `error.code` напряму. Перевірка `"code" in error` на верхньому рівні мовчки не спрацьовує (TypeScript цього не ловить, помилка лише в рантаймі — сира помилка Postgres просто йде користувачу замість дружнього тексту). Виправлено в `deleteCategory` (`server/data/categories.ts`).

### colors
Тенант-конфігурований довідник кольорів (`settings` → «Довідники» → «Кольори»), раніше — app-константа `COLOR_OPTIONS`. `tenant_id`, `name` (англійською), `hex` (`#RRGGBB`), `is_active`, `position`. UNIQUE `(tenant_id, name)` — дві однакові назви кольору в межах тенанта заборонені; на `hex` UNIQUE навмисно нема (два кольори можуть легітимно мати однаковий код, напр. синоніми назв). Індекс `(tenant_id, position)`.

`product_skus.color`/`color_hex` лишаються копією значення на момент створення SKU (не FK на `colors.id`) — як і раніше було задумано для `product_skus` (див. розділ вище): видалення кольору з довідника не ламає вже створені SKU заднім числом. Дев-сід (`npm run db:seed`) заповнює 30 найпоширеніших кольорів одягу (`lib/mocks/colors.ts`) — ідемпотентно (`onConflictDoNothing`, за UNIQUE-обмеженням).

### reference_items
Один спільний довідник для 9 «просто назва» пунктів «Довідники» (settings): `collections`/`seasons`/`fabric-materials`/`manufacturers`/`brands`/`countries`/`currencies`/`units`/`fit` — замість окремої таблиці на кожен тип. `tenant_id`, `kind` (enum `reference_item_kind`, той самий список значень, що `REFERENCE_ITEM_KINDS` у `lib/constants/reference-item-kinds.ts` — тримати синхронно вручну, schema-файли навмисно не імпортують з `lib/`), `name`, `position`. UNIQUE `(tenant_id, kind, name)` — дублікат назви в межах одного kind заборонено, той самий кортеж не заважає різним kind мати однакову назву. Індекс `(tenant_id, kind, position)`.

**Свідомо НЕ увійшли в цей спільний довідник:** «Інструкція по догляду» (потрібна ще й іконка на запис — `CARE_OPTIONS` лишається app-константою, `lib/constants/measurement-types.ts`-подібний випадок) і «Розміри та заміри» (не просто список назв, а ціла розмірна сітка — `SIZE_OPTIONS`/`ProductSizeChart` лишаються як є). «Теги» — теж не тут, має власну таблицю `tags` (нижче) ще з першого проходу товарів, довідник лише додав UI поверх наявних даних.

### tags — тепер і як самостійний довідник
Таблиця `tags` існувала з першого проходу товарів (`product_tags`, синхронізація міток через `syncProductTags`). Розділ «Довідники» → «Теги» (`settings/references/tags`) додав прямий CRUD над тією ж таблицею (`server/data/tags.ts` — `listTags`/`createTag`/`updateTag`/`deleteTag`), без жодних змін схеми. Видалення тегу каскадно прибирає його з `product_tags` (`ON DELETE CASCADE`, уже було в схемі) — товари лишаються, лише без цього тегу; діалог підтвердження явно про це попереджає.

### suppliers / supplier_contacts / supplier_channels / supplier_custom_fields
Довідник постачальників (`settings` → «Довідники» → «Постачальники»). `suppliers`: `tenant_id`, `name`, `code` (генерується сервером, `SUP-0001`...; UNIQUE `(tenant_id, code)` — генерація рахує поточну кількість +1, при рідкісній гонці `createSupplier` ловить `23505` і повторює з наступним номером, до 5 спроб), `type` (enum `manufacturer`/`distributor`/`wholesaler`/`importer`/`other`), `is_active`, `website`, `country`/`city`/`address`, `notes`. Індекс `(tenant_id, created_at)`.

**`postal_code` видалено** (міграція `0009`, `ALTER TABLE suppliers DROP COLUMN postal_code`) — поле забрали з форми за прямою вказівкою людини («Індекс не потрібен») одразу після створення таблиці, дані ще не встигли з'явитись, тож дропнули колонку, а не лишили осиротілою.

Три дочірні таблиці — усі `supplier_id` FK `ON DELETE CASCADE`, `tenant_id` денормалізовано (як `product_tags`, щоб RLS не залежав від join), індекс `(tenant_id, supplier_id, position)`:
- `supplier_contacts` — кілька контактних осіб на постачальника: `name`, `job_title`, `phone`, `email`.
- `supplier_channels` — месенджери й соцмережі одним рядком: `kind` (enum `messenger`/`social`), `channel` (вільний текст: `telegram`/`viber`/`whatsapp`/`facebook`/`instagram`/`tiktok`/`threads` — не enum, бо фіксований набір живе в UI-довіднику `lib/constants/supplier-options.ts`, не є окремою БД-сутністю), `value`.
- `supplier_custom_fields` — довільні пари «назва поля — значення» в блоці адреси, людина сама називає поле: `label`, `value`.

Збереження форми — **delete-then-insert** для всіх трьох дочірніх колекцій одразу (`updateSupplier`, `server/data/suppliers.ts`), той самий патерн, що `syncProductTags` у `server/data/products.ts`: просто й коректно для «зберегти всю форму одним запитом», без per-рядкового diff.

**Іконки месенджерів/соцмереж — справжні бренд-лого через `react-icons`.** `lucide-react` підтверджено не має брендових іконок (Facebook, Instagram, Telegram, Twitter, Youtube, Linkedin, Github — усі відсутні). Погоджено з людиною (`AskUserQuestion`) додати `react-icons` (набір `fa6`, tree-shakeable) замість самописних SVG — кожна іконка в кольоровому кружечку брендового кольору (`lib/constants/supplier-options.ts`). Деталі — `decisions.md`.

## Що свідомо НЕ нормалізовано зараз (і чому)
Розміри (`SIZE_OPTIONS`), типи замірів (`MEASUREMENT_TYPE_OPTIONS`) — лишаються app-константами, не таблицями. Причини: (1) роадмап цього проходу обмежений `products`/`product_skus` + логічно пов'язаним; (2) список поки спільний для всіх тенантів — таблиця зараз стартувала б як ще один глобальний виняток без реальної потреби; (3) `product_skus.size` вже зараз — копія значення на момент створення SKU, не посилання. Кольори вже нормалізовані (`colors`, вище) — той самий перехід, коли знадобиться, підходить і для розмірів: `sizes(id, tenant_id, label)` з FK.

**Оновлення:** `products.supplier_id` тепер реальний FK на `suppliers.id` (вище, розділ `products`) — раніше тут описувалось як «майбутня задача», зроблено. Фільтра товарів за постачальником у `listProducts` ще нема (окремий індекс `(tenant_id, supplier_id)` не додавали — немає поки запиту, що його потребує).

## Файлове сховище (завантажені зображення)
Зображення категорій — перший реальний (не blob-прев'ю) файловий аплоад у проєкті. `src/server/storage/category-images.ts`:
- Диск, не БД: `<корінь проєкту>/storage/uploads/<tenantId>/categories/<uuid>.<ext>` — поза `public/` (не роздається статично напряму Next.js) і поза `src/` (не в бандлі). `/storage/` — у `.gitignore`.
- Валідація на сервері (не лише в UI): розмір ≤ 5 МБ, тип лише `image/jpeg`/`image/png`/`image/webp` (білий список за MIME, не за розширенням з імені файлу).
- Роздача — через `src/app/api/uploads/categories/[filename]/route.ts`, **не** напряму з диска: `filename` у URL опаковий (`crypto.randomUUID()`, без `tenant_id` усередині), маршрут сам бере `tenantId` з `getDevTenantId()` (сервер) і шукає файл у теці саме цього тенанта. Чужий тенант, знаючи чужий `filename`, отримає 404 (файл просто не існує в його теці) — той самий принцип ізоляції, що й у БД, тільки на рівні файлової системи, а не RLS.
- `filename`, що приходить у route handler з URL, звіряється з regex (`[a-zA-Z0-9_-]+.(jpg|png|webp)`) перед читанням файлу — захист від path traversal.

Фото товару й фото кольору — той самий патерн, узагальнений у `src/server/storage/product-images.ts` (параметр `kind`: `"products"` \| `"product-colors"` — окрема підтека тенанта на кожен вид, категорії лишились окремим файлом `category-images.ts`, не займали робочий код без потреби). Роздача — два окремі route: `api/uploads/products/[filename]`, `api/uploads/product-colors/[filename]` (кожен фіксує свій `kind`, а не приймає його з URL). **Гочта, яку ловили тут:** константу-ліміт (`MAX_COLOR_PHOTOS`) не можна імпортувати в клієнтський компонент із `server/data/*` — навіть якщо тягнеться лише значення константи, весь модуль (а з ним `postgres`/`fs`) потрапляє в клієнтський бандл і валить збірку (`Module not found: Can't resolve 'fs'`). Такі константи, потрібні і клієнту, і серверу, — окремий файл у `lib/constants/`, не `server/*`.

**Гочта з drizzle-kit generate при перейменуванні таблиці:** коли стара таблиця (`product_sku_photos`) видаляється зі схеми, а нова (`product_color_photos`) з подібною формою додається в тому самому проході — `drizzle-kit generate` розпізнає це як можливе перейменування і намагається запитати інтерактивно («це перейменування чи нова таблиця?»), що падає в non-TTY середовищі (`Interactive prompts require a TTY terminal`). Обхід — генерувати в два окремі проходи: спершу видалити стару таблицю зі схеми й згенерувати/накотити суто DROP-міграцію, потім додати нову таблицю окремим проходом (чиста CREATE-міграція, без двозначності).

## Довідники підключення
- `DATABASE_URL` — власник схеми, для міграцій (`drizzle-kit generate`/`migrate`) і сіду. Обходить RLS.
- `APP_DATABASE_URL` — `app_user`, non-owner, для запитів застосунку (`src/server/db/client.ts`). RLS діє.
- `DEV_TENANT_ID` — `TODO(auth)`, тимчасове джерело `tenantId` до появи сесій.

## Команди
```
docker compose up -d       # підняти Postgres локально
npm run db:generate        # згенерувати SQL-міграцію зі схеми
npm run db:migrate         # накотити міграції
npm run db:setup-role      # створити/оновити non-owner роль app_user (ідемпотентно)
npm run db:seed            # засіяти dev-тенант + приклад товару, категорії, 30 кольорів (lib/mocks/*.ts)
npm run db:studio          # Drizzle Studio (перегляд/редагування даних)
```

## Перевірка ізоляції тенантів (виконано під час підключення)
`EXPLAIN ANALYZE` на `SELECT ... WHERE tenant_id = ? AND status = 'active'` — план використовує `Index Scan using products_tenant_status_idx`, без seq scan. Ізоляція перевірена і на рівні data-access шару (свій/чужий `tenantId` → товар/`null`), і напряму як `app_user` без жодного `WHERE tenant_id` у самому SQL (RLS сама відсікає чужі рядки) — див. розділ вище.

Для `categories` (write + read, окремо від products) перевірено так само: чужий тенант не бачить жодної категорії (`listCategories` → 0), не може прочитати категорію, створену іншим тенантом (`getCategoryById` → `null`), і `createCategory` під одним тенантом не робить дані видимими іншому.

Для зв'язку `products.category_id`: чужий тенант, знаючи `productId` і `categoryId`, не може змінити чужий товар (`updateProductCategory` під чужим `tenantId` — 0 рядків, значення лишається попереднім), і `getProductCountsByCategory` під чужим тенантом повертає порожній об'єкт, навіть коли у свого тенанта є прив'язані товари.
