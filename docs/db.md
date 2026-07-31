# DB

PostgreSQL 16 (Docker Compose, локально) + Drizzle ORM. Схема: `src/server/db/schema/*.ts`. Міграції: `drizzle/migrations/` (генеруються, комітяться в git, ніколи не редагуються вручну заднім числом).

## Мультитенантність (розділ 6 CLAUDE.md) — як дотримано

1. **`tenant_id` на кожній прикладній таблиці.** Єдиний виняток — `tenants` (сам довідник тенантів, глобальна таблиця за визначенням).
2. **Два незалежні рубежі захисту:**
   - Перший — явний `WHERE tenant_id = ...` у кожному запиті data-access шару (`src/server/data/*`).
   - Другий — PostgreSQL Row-Level Security: усі прикладні таблиці мають `ENABLE ROW LEVEL SECURITY` + політику `tenant_isolation` (`src/server/db/schema/rls.ts`), що звіряє `tenant_id` із сесійною змінною `app.tenant_id`.
3. **`tenant_id` — тільки з сервера.** Наразі немає авторизації/сесій, тому джерело тимчасове: `src/server/tenant/get-tenant-id.ts` (`DEV_TENANT_ID` з `.env`, позначено `TODO(auth)`). Клієнт (URL, форма) `tenant_id` ніколи не передає.
4. **Композитні індекси tenant_id-перші** — усюди, де є частий `WHERE`/`ORDER BY` (див. таблиці нижче).
5. **UNIQUE у межах тенанта** — `products (tenant_id, model_code)`, `product_skus (tenant_id, code)`, `product_skus (tenant_id, barcode)` (частковий, ігнорує `NULL`), `custom_characteristic_values (tenant_id, characteristic_id, value)`.
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

### product_tags
Junction товар↔тег; `tenant_id` тут навмисно **денормалізований** (виводиться з `product_id`/`characteristic_value_id`), щоб буквально виконати правило «кожна прикладна таблиця має tenant_id» і щоб RLS-політика не залежала від join. `characteristic_value_id` — FK на `custom_characteristic_values.id` (раніше — на окрему таблицю `tags`, перенесено — деталі нижче, розділ «Теги»). PK `(product_id, characteristic_value_id)`, індекс `(tenant_id, characteristic_value_id)`.

### categories
Ієрархія категорій вітрини (модуль `settings`, вкладка «Категорії товару»): `tenant_id`, `parent_id` (самопосилання на `categories.id`, `NULL` = коренева), `name`, `description`, `image_url`, `is_active` («Активна на вітрині»), `show_in_storefront_section`, `show_in_header_menu`, `default_weight_kg`/`default_length_cm`/`default_width_cm`/`default_height_cm` (підставляються товару категорії, якщо там не вказано своє), `seo_h1`/`seo_meta_title`/`seo_meta_description`, `position` (для майбутнього drag-and-drop сортування — колонка є, сама функція сортування в UI ще не зроблена).

Індекси: `(tenant_id, parent_id)`, `(tenant_id, created_at)`. **UNIQUE на `name` навмисно нема** (не підтверджено з людиною, чи назва категорії унікальна навіть у межах тенанта — на відміну від `products.model_code`, де це підтверджено).

**`parent_id` — `ON DELETE RESTRICT`, не `SET NULL`/`CASCADE`.** Видалення категорії з дочірніми — заборонено на рівні самої БД (Postgres відхиляє DELETE, поки є діти), а не лише перевіркою в коді — так це діє, навіть якщо колись з'явиться інший шлях запису повз `src/server/data/categories.ts`. Захист від **циклу** в ієрархії (категорія стає батьком власного нащадка) — окрема перевірка в `updateCategoryAction` (`src/lib/categories/tree.ts` → `isDescendantCategory`), бо сам FK цього не ловить (це не рекурсивний CHECK).

**`products.category_id → categories.id` — підключено** (раніше цього розділу не було, товари й категорії були не пов'язані; тепер FK є, і колонка «Товарів» у таблиці категорій рахує реальні дані через `getProductCountsByCategory` — `GROUP BY category_id`, без N+1, і рекурсивно сумується по дереву на клієнті для батьківських категорій). `category`/`category_path` (вільний текст) при цьому **не оновлюються** автоматично при виборі `category_id` — два джерела даних про категорію товару поки існують паралельно, не синхронізовано. Це свідомий, обмежений за часом компроміс (не просили синхронізувати текстові поля), а не забута робота — але вартий уваги, якщо десь використовується `product.category`/`categoryPath` для відображення (напр. хлібні крихти `ProductHeader`) і очікується, що воно відповідає реально обраній категорії.

**Гочта Drizzle, яку ловили на цій таблиці:** коли `tx.delete(...)` падає через FK-порушення, Drizzle обгортає сиру помилку `postgres.js` у `DrizzleQueryError` — реальний Postgres-код (`error.code`, напр. `'23503'`) лежить у **`error.cause.code`**, не в `error.code` напряму. Перевірка `"code" in error` на верхньому рівні мовчки не спрацьовує (TypeScript цього не ловить, помилка лише в рантаймі — сира помилка Postgres просто йде користувачу замість дружнього тексту). Виправлено в `deleteCategory` (`server/data/categories.ts`).

### colors
Тенант-конфігурований довідник кольорів (`settings` → «Довідники» → «Кольори», відкривається попапом `ColorsFormDialog` з плитки `ColorsTile` — раніше була окрема сторінка `/settings/references/colors`, видалена), раніше — app-константа `COLOR_OPTIONS`. `tenant_id`, `name` (англійською), `hex` (`#RRGGBB`), `is_active`, `position`. UNIQUE `(tenant_id, name)` — дві однакові назви кольору в межах тенанта заборонені; на `hex` UNIQUE навмисно нема (два кольори можуть легітимно мати однаковий код, напр. синоніми назв). Індекс `(tenant_id, position)`.

`product_skus.color`/`color_hex` лишаються копією значення на момент створення SKU (не FK на `colors.id`) — як і раніше було задумано для `product_skus` (див. розділ вище): видалення кольору з довідника не ламає вже створені SKU заднім числом. Дев-сід (`npm run db:seed`) заповнює 30 найпоширеніших кольорів одягу (`lib/mocks/colors.ts`) — ідемпотентно (`onConflictDoNothing`, за UNIQUE-обмеженням).

### currencies
Тенант-конфігурований довідник валют (`settings` → «Довідники» → «Валюти»), окрема таблиця, не `reference_items` — валюті потрібні код/символ/позиція/знаки після коми/курс, не просто назва. `tenant_id`, `code` (ISO 4217, напр. `UAH`), `name`, `symbol`, `symbol_position` (enum `before`/`after`), `decimal_places`, `is_active`, `is_default`, `exchange_rate` (nullable, `numeric(14,6)` — курс відносно базової валюти тенанта; для самої базової завжди `NULL`, курс до себе = 1), `rate_updated_at`, `auto_update` (за замовчуванням `true`), `position`.

UNIQUE `(tenant_id, code)`. **`(tenant_id) WHERE is_default = true`** — частковий UNIQUE-індекс: лише одна валюта за замовчуванням на тенанта, підтверджено на рівні БД (не лише перевіркою в коді) — `createCurrency`/`updateCurrency` спершу знімають `is_default` з усіх інших валют тенанта в тій самій транзакції, тому проміжного стану «нуль базових валют» ніколи не видно ззовні. Видалення базової валюти заблоковано в data-access шарі (дружня помилка «спочатку призначте іншу базовою») — на рівні БД це не FK-обмеження, тож перевірка лише прикладна, на відміну від `categories.parent_id`.

**Курси — з НБУ** (`src/server/integrations/nbu.ts`, публічний API банку без ключа, `fetch` на `bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=...&json`). Дві точки виклику: одинична кнопка «Оновити курс» на рядку валюти й пакетна «Оновити курси» (усі з `auto_update = true`, крім базової). **Обидві — по кліку користувача, не за розкладом**: інфраструктури для реального cron/scheduled job (Vercel Cron, зовнішній тригер на API-роут тощо) у проєкті ще нема, і рішення, яку саме платформу деплою й спосіб планування використовувати, свідомо не прийнято мовчки — відкритий пункт нижче. Контракт полів НБУ (`cc`/`rate`/`exchangedate`) — задокументована й стабільна структура, але живий виклик не перевірявся в сесії розробки (без мережевого доступу з пісочниці) — перший реальний виклик з UI варто перевірити.

Індекс `(tenant_id, position)`. Дев-сід заповнює 4 стартові валюти (`lib/mocks/currencies.ts`): UAH (базова), USD, EUR, PLN — без курсу/дати оновлення (`NULL`), щоб не видавати вигадані дані за реальні з НБУ.

**`currencies` раніше був одним із 9 kind у `reference_items`** (нижче) — значення `"currencies"` лишається валідним у pg-enum `reference_item_kind` назавжди (Postgres не підтримує `DROP VALUE` для enum), але прибрано з `REFERENCE_ITEM_KINDS` (`lib/constants/reference-item-kinds.ts`), нових записів з таким `kind` більше не створюється; єдиний тестовий рядок, що встиг з'явитись до переходу, лишився в таблиці як нешкідливе сміття (не варте окремої міграції очищення).

### reference_items
Один спільний довідник для 3 «просто назва» пунктів «Довідники» (settings, група «Системні»): `manufacturers`/`countries`/`units` — замість окремої таблиці на кожен тип. `tenant_id`, `kind` (enum `reference_item_kind`, той самий список значень, що `REFERENCE_ITEM_KINDS` у `lib/constants/reference-item-kinds.ts` — тримати синхронно вручну, schema-файли навмисно не імпортують з `lib/`), `name`, `position`. UNIQUE `(tenant_id, kind, name)` — дублікат назви в межах одного kind заборонено, той самий кортеж не заважає різним kind мати однакову назву. Індекс `(tenant_id, kind, position)`.

**`collections`/`seasons`/`brands`/`fit` — БУЛИ тут, перенесені в `custom_characteristics`** за прямою вказівкою (разом із «Тегами», вище) — значення enum лишаються валідними в pg-enum `reference_item_kind` назавжди (Postgres не підтримує `DROP VALUE`), прибрано лише з `REFERENCE_ITEM_KINDS`/`REFERENCE_DEFS`, нових записів з такими `kind` більше не створюється. Перенесення виконано одноразовим скриптом (той самий прохід, що й для тегів, вище): 5 колекцій, 6 сезонів, 100 брендів скопійовано в `custom_characteristics`/`custom_characteristic_values`, старі рядки `reference_items` видалено.

**Свідомо НЕ увійшли в жоден спільний довідник:** «Інструкція по догляду» (потрібна ще й іконка на запис — `CARE_OPTIONS` лишається app-константою, `lib/constants/measurement-types.ts`-подібний випадок) і «Розміри та заміри» (не просто список назв, а ціла розмірна сітка — `SIZE_OPTIONS`/`ProductSizeChart` лишаються як є). **«Тип тканини та матеріал» (`fabric-materials`) — БУВ тут, отримав власні таблиці** (значно багатший за «просто назва»: склад, можливі матеріали, сезон, розтяжність, зображення, догляд) — нижче.

### custom_characteristics / custom_characteristic_values
Довідники, які власник магазину створює сам у рантаймі (плитка «+ Додати довідник» у групі «Характеристики товару», попап create/edit-в-одному). **Не потребує нової колонки чи таблиці на кожну нову характеристику** — саме для цього тут дві генеричні таблиці, а не розширення `reference_items.kind` (той — фіксований pg-enum, значення задаються в коді; `ALTER TYPE ... ADD VALUE` з коду застосунку на кожну довільну назву, яку вводить людина в попапі, — поганий шлях: DDL з боку користувача, неконтрольований ріст enum). Замість цього — класична модель «характеристика → її значення»:

- `custom_characteristics`: `tenant_id`, `name` (сама характеристика, напр. «Тип комірця»), `system_key` (nullable text, частковий UNIQUE `(tenant_id, system_key) WHERE system_key IS NOT NULL` — стабільний технічний ключ для характеристик, від яких залежить інша функціональність застосунку; єдине значення поки — `"tags"`, нижче), `show_in_crm`/`show_on_storefront`/`participates_in_filters` (booleans, за замовчуванням `true` — 3 перемикачі-іконки, тепер **прямо на плитці**, не в попапі), `position`. UNIQUE `(tenant_id, name)`.
- `custom_characteristic_values`: `tenant_id`, `characteristic_id` (FK, `ON DELETE CASCADE` — видалення характеристики видаляє й усі її значення), `value` (напр. «Суцільнокрійний»), `position`. UNIQUE `(tenant_id, characteristic_id, value)` — значення унікальне в межах своєї характеристики, той самий текст в іншій характеристиці — не конфліктує. Індекс `(tenant_id, characteristic_id, position)`.

Попап (`CustomCharacteristicFormDialog`) — і створення, і редагування: лише назва + значення (ввід-тегами — Enter додає чіп, X прибирає, як «Теги» на картці товару). 3 перемикачі-іконки (`Tooltip`) і кнопка-кошик — **на самій плитці** (`CustomCharacteristicTile`), не в попапі, за прямою вказівкою (щоб не відкривати попап заради швидкої дії); зберігаються окремим Server Action (`updateCustomCharacteristicFlagsAction`), не зачіпаючи назву/значення. Клік по плитці характеристики одразу відкриває попап редагування — окремої сторінки-списку більше нема (за прямою вказівкою: раніше був `/settings/references/custom/[id]`, прибрано). Кошик на плитці видаляє характеристику цілком (каскадно й значення); «Решту довідників» (усе, що лишилось у `REFERENCE_DEFS`/`reference_items`/`colors`/`currencies`/`suppliers`) видалити не можна — ця можливість є лише в custom_characteristics за визначенням.

### reference_dictionary_flags
Ті самі 3 перемикачі (`show_in_crm`/`show_on_storefront`/`participates_in_filters`), але для довідників групи «Характеристики товару», які **не** є `custom_characteristics` — «Кольори» (`colors`), «Тип тканини та матеріал» (`reference_items`, kind=`fabric-materials`), «Інструкція по догляду» (`care-instructions`) і «Розміри та заміри» (`measurements`; останні два — ще без власного БД-списку значень, `db.md`/`modules/settings.md`). Жоден з чотирьох не має природного «рядка на весь довідник» у своїй таблиці (Кольори/Тип тканини — список рядків; Інструкція по догляду/Розміри та заміри — узагалі ще без таблиці), куди покласти 3 boolean. Замість дублювання цих трьох колонок у `colors`/`reference_items`, або силуваної міграції в `custom_characteristics` — генерична тенант-скоупована таблиця, не залежна від наявності реального списку значень: `tenant_id`, `dictionary_key` (text, довільний стабільний ключ — `"colors"`/`"fabric-materials"`/`"care-instructions"`/`"measurements"`), `show_in_crm`/`show_on_storefront`/`participates_in_filters`, `updated_at`. PK `(tenant_id, dictionary_key)` (і сам за себе унікальний індекс, і фільтр tenant-first). Рядок з'являється лише після першого тоглу (`onConflictDoUpdate` upsert) — доки його нема, застосунок трактує довідник як `{true, true, true}` за замовчуванням у коді (`listDictionaryFlags`), не в БД.

**`updateCustomCharacteristic` (`server/data/custom-characteristics.ts`) переносить набір значень діфом, не `delete-then-insert` усього списку** — видаляє лише прибрані значення, додає лише нові, лишає незмінні з тими самими `id`. Критично для характеристики «Теги» (нижче): `id` значення — ціль FK з `product_tags`, і повне переприсвоєння `id` при кожному збереженні непомітно стирало б прив'язку тегів до товарів навіть коли набір значень фактично не змінився.

**Свідомо поза цим кроком:** підключення цих характеристик до самої картки товару (щоб їх можна було обрати як значення поля товару, крім «Тегів») — довідник існує сам собою, форма товару його ще не читає, як і для 4 «просто назва» довідників `reference_items` (не просили).

### Теги — тепер рядок custom_characteristics, не окрема таблиця
За прямою вказівкою (людина свідомо погодилась на ризик, `decisions.md`) стара таблиця `tags` + `product_tags.tag_id` **видалені**; теги товару — звичайна характеристика `custom_characteristics` з `system_key = 'tags'`, її значення — рядки `custom_characteristic_values`. `product_tags.tag_id` (FK на `tags.id`) замінено на `product_tags.characteristic_value_id` (FK на `custom_characteristic_values.id`, `ON DELETE CASCADE`), PK — `(product_id, characteristic_value_id)`.

`syncProductTags` (`server/data/products.ts`) — той самий find-or-create, що раніше був для `tags`, лише тепер: `getOrCreateTagsCharacteristicId` знаходить (або створює) характеристику за `system_key = 'tags'` тенанта, потім find-or-create значення в `custom_characteristic_values` цієї характеристики за міткою. Зовнішній тип `Product.tags: {id,label}[]` і весь UI картки товару (`ProductMetaPanel`/`TagsSection`) **не змінились** — лише джерело в БД.

**Чому `system_key`, а не пошук за назвою «Теги»:** людина може перейменувати відображувану назву характеристики в попапі — пошук за текстом зламав би прив'язку тегів до товарів мовчки. `system_key` — стабільний, не показується в UI, незалежний від перейменування.

**Двофазна міграція наявних даних (без втрати):** міграції `0015` (адитивна: нова `characteristic_value_id` поруч зі старою `tag_id`, нові колонки `custom_characteristics`) → одноразовий скрипт переносу (`tags`+`product_tags.tag_id` → `custom_characteristics`/`custom_characteristic_values`/`product_tags.characteristic_value_id`, той самий скрипт переніс і `reference_items` для `collections`/`seasons`/`brands`/`fit`, нижче) → міграція `0016` (руйнівна: `DROP TABLE tags`, `product_tags` без `tag_id`, `characteristic_value_id` — `NOT NULL` + PK). Перевірено на dev-даних: 4 теги / 4 зв'язки `product_tags` — жодного втраченого після переносу.

### materials
Тенант-конфігурований довідник матеріалів (`settings` → «Довідники» → «Тип тканини та матеріал» → вкладка «Матеріали») — той самий патерн, що `colors`: `tenant_id`, `name`, `color` (nullable hex, суто ілюстративний зразок-кружечок), `category` (nullable enum `material_category` — `natural`/`cellulose`/`synthetic`/`leather`/`fur`/`rubber`/`other`, фіксований набір, той самий підхід, що `fabric_stretch`/`fabric_season` нижче: розробник задає значення в коді, не людина через попап), `position`. UNIQUE `(tenant_id, name)`, індекс `(tenant_id, position)`. З цього довідника обираються значення в `fabric_type_composition`/`fabric_type_possible_materials` нижче — видалення матеріалу каскадно прибирає його з усіх типів тканини, де він був використаний (`ON DELETE CASCADE`), без окремого попередження «де саме використовується» (лише загальний текст у діалозі підтвердження).

**Dev-сід — 55 матеріалів за прямим списком людини** (`lib/mocks/materials.ts`, `db:seed`), з розбивкою по 7 категоріях (натуральні/штучні целюлозні/синтетичні/шкіра/хутро/гума та подібні/інші). Дедуп при перенесенні списку в дані: «Штучна шкіра» дублювалась у категорії «Шкіра» (лишена раз), «ПВХ» фігурувала і в «Синтетичні», і в «Гума та подібні матеріали» (лишена лише в «Синтетичні» — `UNIQUE(tenant_id, name)` не дозволяє той самий матеріал у двох категоріях одночасно). Сід — `onConflictDoUpdate` (не `onConflictDoNothing`, на відміну від решти сідів): якщо матеріал з такою назвою вже існує (напр. людина встигла створити вручну через UI до запуску сіду), оновлюється лише `category`, `color`/`position` наявного рядка не чіпаються — перевірено на «Бавовна», створеній людиною під час ручного тестування попереднього раунду. **Категорія поки ніде не показується/не фільтрується в UI** (`MaterialsTab` — плоский список без групування) — дані в БД є, візуалізацію не робили, не просили (`modules/settings.md`, «Відкрито»).

### care_instructions
Тенант-конфігурований довідник рекомендацій по догляду (назва + іконка) — **реальні записи в БД, не хардкод-список**: `tenant_id`, `name` (напр. «Прання при 30°C»), `icon` (text-ключ із фіксованого набору-кандидатів `CARE_INSTRUCTION_ICON_OPTIONS`, `lib/constants/care-instruction-icons.ts` — 12 lucide-іконок, синхронізувати вручну, як і решта key-до-компонента мапінгів у проєкті), `position`. UNIQUE `(tenant_id, name)`, індекс `(tenant_id, position)`. Керується прямо з попапу типу тканини (`FabricTypeCareInstructionsField` — «+ Додати інструкцію», назва+вибір іконки), окремої сторінки-списку нема. **Не плутати з `reference_dictionary_flags` записом `dictionary_key = "care-instructions"`** — той належить іншій, порожній заглушці-плитці «Інструкція по догляду» в `REFERENCE_DEFS` (без даних, лише 3 перемикачі); збіг назви випадковий, об'єднання цих двох механізмів не робили — не просили, і це вихід за межі задачі (`modules/settings.md`, «Відкрито»).

### fabric_types / fabric_type_composition / fabric_type_possible_materials / fabric_type_seasons / fabric_type_care_instructions
Довідник «Тип тканини та матеріал» (`/settings/references/fabric-materials`, вкладка «Типи тканини») — замінив колишній `reference_items` kind=`fabric-materials` («просто назва») значно багатшою карткою за зразком-скріном людини.

- `fabric_types`: `tenant_id`, `name`, `code` (text, автогенерований slug — спрощена транслітерація кирилиці в латиницю, напр. «Футер 3-нитка» → `futer-3-nitka`, не офіційний стандарт, лише читабельний URL-безпечний код; унікальність — ретрай із суфіксом `-2`/`-3`...), `description`, `density` (text, вільний формат — напр. «320-340 г/м²», не окремі числові min/max колонки), `stretch` (nullable enum `fabric_stretch`: `low`/`medium`/`high`), `recommended_use` (text, вільний — «Худі, світшоти, штани»; **свідомо НЕ FK на `categories`** — за прямою вказівкою людини під час інтерв'ю: «категорії товарів туди не додавай», хоча зразок-скрін мав чекбокси категорій), `schema_image_url`/`schema_notes` (зображення схеми тканини + нотатки, кожен рядок нотаток → пункт списку в UI), `is_active`, `position`. UNIQUE `(tenant_id, name)` і `(tenant_id, code)`, індекс `(tenant_id, position)`.
- `fabric_type_composition`: `tenant_id`, `fabric_type_id` (FK cascade), `material_id` (FK на `materials.id`, cascade), `percent` (smallint), `position`. PK `(fabric_type_id, material_id)` — один матеріал раз у складі. «Типовий склад» — підказка при створенні товару, сума 100% не валідується (`conventions.md`: валідація на сервері лише де це предмет реальної помилки, не орієнтовне поле).
- `fabric_type_possible_materials`: `tenant_id`, `fabric_type_id` (FK cascade), `material_id` (FK cascade). PK `(fabric_type_id, material_id)`. Ширший чекбокс-набір за «Типовий склад» — що взагалі допустиме для типу тканини, не обов'язково та сама пропорція.
- `fabric_type_seasons`: `tenant_id`, `fabric_type_id` (FK cascade), `season` (enum `fabric_season`: `spring`/`summer`/`autumn`/`winter`). PK `(fabric_type_id, season)`.
- `fabric_type_care_instructions`: `tenant_id`, `fabric_type_id` (FK cascade), `care_instruction_id` (FK на `care_instructions.id`, cascade). PK `(fabric_type_id, care_instruction_id)`.

Усі 4 junction-таблиці — `tenant_id` денормалізовано (як `product_tags`/дочірні `suppliers`), щоб RLS не залежав від join, індекс `(tenant_id, fabric_type_id)`. Збереження типу тканини (`updateFabricType`) **завжди `delete-then-insert` усіх чотирьох наборів разом** (`syncChildren`, `server/data/fabric-types.ts`) — на відміну від `custom_characteristics`, значення тут ніде не є ціллю зовнішнього FK з іншої таблиці (немає аналога `product_tags.characteristic_value_id`), тож діф-алгоритм не потрібен: id-черн при кожному збереженні нікому не зашкодить.

`stretch`/`season` — невеликі фіксовані pg-enum (розробник задає значення в коді), не окремі тенант-керовані довідники, на відміну від «Сезон» серед `custom_characteristics` (два різні «Сезони» під різними механізмами в системі — свідомо, `modules/settings.md`, «Відкрито»).

Список типів тканини (`listFabricTypesWithDetails`) віддає одразу все з деталями (4 паралельні batch-запити на дочірні таблиці, не по одному на вибір у списку) — клієнт сам фільтрує/пагінує (по 10) серед уже завантажених даних, без client-side data-fetching бібліотеки в проєкті й без окремого запиту при виборі рядка. Обсяг тенантного довідника малий, тож це прийнятно; за реального масштабу (сотні типів) варто перейти на серверну пагінацію.

Зображення схеми тканини — реальне файлове сховище, той самий патерн, що `category-images.ts`: `server/storage/fabric-type-images.ts` + `api/uploads/fabric-types/[filename]/route.ts`, диск поза webroot, `tenantId` роздачі — з сесії (`getDevTenantId()`), не з URL.

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
