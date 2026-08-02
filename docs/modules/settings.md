# Модуль: settings

**Статус:** UI `в роботі` · Логіка `—` · Бек `в роботі` · БД `в роботі`
**Маршрут:** /settings?tab=..., /settings/categories/new, /settings/categories/[id]
**Оновлено:** 2026-08-02 (Довідники розрізано в піддокумент `settings-references.md` — файл модуля впритул до ліміту, розділ 0 CLAUDE.md)

## Призначення
Сторінка налаштувань магазину: розділи (вітрина, загальні, категорії товару, замовлення, довідники, склади, доставка, оплата, тарифний план) — вибираються через підменю сайдбару (розгортається інлайн під «Налаштування»), розділ у URL як `?tab=`. «Категорії товару» — повний CRUD з реальною БД (список/створення/редагування/видалення, ієрархія, зображення, успадкування від батьківської — `settings-category-characteristics.md`). «Довідники» — файли/дані/історія повністю в `settings-references.md` (модуль переріс ліміт розділу 0).

## Файли
| Шлях | Роль |
|---|---|
| src/app/settings/layout.tsx | лише `robots`-метадані розділу — сайдбар глобальний, у кореневому `src/app/layout.tsx` (ui-kit.md) |
| src/app/settings/page.tsx | сторінка, збирає header + активний розділ; розділ читається з `searchParams.tab` (не Tabs-стан), невідоме/відсутнє значення тихо трактується як `"categories"`; дані тягнуться лише під активний розділ; кожен блок обгорнутий `DevBlockLabel` |
| src/components/settings/SettingsHeader.tsx | хлібна крихта («Налаштування») + `HeaderActions` праворуч + заголовок |
| src/components/settings/CategoriesTab.tsx | вкладка «Категорії товару» (Client Component) — `categories`/`productCounts` пропами. Пошук+фільтр статусу, масове виділення (каскадно на нащадків, `getDescendantIds`), дворівнева ієрархія (`buildCategoryTree`). «Товарів» — реальна кількість (`effectiveProductCount`). Дії по рядку: око → `toggleCategoryActiveAction`, олівець → редагування, кошик → `DeleteCategoryButton`. Масове «Видалити» — знизу вгору (найглибші першими) |
| src/components/settings/CategoryForm.tsx, CategoryFormHeader.tsx | спільна форма створення/редагування (Client Component). 2026-08-02 — «Основне» (наявної категорії) **автозберігається** (conventions.md): будь-яка зміна поля перезапускає 500мс debounce → `formRef.current?.requestSubmit()`, без кнопки; на `/new` лишається явна кнопка «Створити категорію» (дія створення). «Характеристики» — свідомий виняток, лишається з кнопкою й попередженням про каскад (`settings-category-characteristics.md`). `CategoryFormHeader` показує або кнопки (create/characteristics), або індикатор `saveStatus`, залежно від вкладки. Ліва колонка «Основне»: назва, батьківська категорія — `CategoryTreeSelect`, опис + «SEO». Права колонка: зображення, 3 перемикачі, вага/розміри за замовчуванням |
| src/components/categories/CategoryTreeSelect.tsx | спільний ієрархічний `Select`-піклер категорій (`excludeIds`, опційний `noneOption`) |
| — (див. `settings-category-characteristics.md`) | Успадкування від батьківської категорії (3 перемикачі показу + вага/розміри) і вкладка «Характеристики» (drag&drop, `CategoryCharacteristicsPicker`) — модель «останнє редагування виграє каскадом» (2026-08-02). Модуль переріс ліміт, файли й повна історія — в піддокументі |
| src/app/settings/categories/new/page.tsx, [id]/page.tsx | Server Components — тягнуть категорії/характеристики, рендерять `CategoryForm`; `[id]` — `notFound()` |
| src/app/settings/categories/actions.ts | Server Actions: `createCategoryAction`, `updateCategoryAction` (захист від циклу — `isDescendantCategory`), `deleteCategoryAction`, `deleteCategoriesAction` (масове, глибші першими), `toggleCategoryActiveAction`, `uploadCategoryImageAction` |
| src/server/data/categories.ts | `listCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` (FK-порушення `23503` → дружній текст), `toggleCategoryActive`, `getProductCountsByCategory` |
| src/server/storage/category-images.ts, src/app/api/uploads/categories/[filename]/route.ts | реальне файлове сховище — диск поза webroot, per-tenant теки, роздача через route handler із `tenantId` із сесії |
| src/lib/categories/tree.ts | `buildCategoryTree`, `isDescendantCategory`, `getDescendantIds`, `categoryDepth`, `getCategoryPath` |
| src/components/ui/checkbox.tsx | базовий компонент (shadcn CLI) — масове виділення в `CategoriesTab` |
| — (див. `settings-references.md`) | Розділ «Довідники» (`?tab=references`) — 8+ довідників групи «Характеристики товару» (Кольори/Тип тканини/Матеріали/Інструкція по догляду/Розміри/Заміри/довільні `custom_characteristics`) + 5 «Системні» (Виробники/Постачальники/Країни/Валюти/Одиниці виміру). Файли/дані/повна історія — в піддокументі |

## Використовує з ui-kit
Sidebar (другорядне меню — розділи), HeaderActions, Card, Table, Select, Input, Button, Badge, Checkbox, Dialog, Switch, Textarea

## Дані
«Категорії товару» — таблиця `categories`, повний CRUD, тенант-скоуповано, RLS. `products.category_id` (FK на `categories.id`, `ON DELETE SET NULL`) — реальний зв'язок товару з категорією. Довідники — `settings-references.md`.

**Нюанс Select з ui-kit:** якщо `value` опції не збігається з людським лейблом, `SelectValue` треба явно дати render-функцію — інакше показує сирий `value`.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: layout (ui-kit, Sidebar) — «Налаштування» в сайдбарі розгортає інлайн-підменю з розділами цього модуля (`?tab=...`)
Від нього залежать: —

## Зроблено
- 2026-08-02 — «Основне» категорії (наявної) перейшло на автозбереження — кнопку «Зберегти» прибрано, кожна зміна поля сама йде в БД через короткий debounce; загальне правило для всього проєкту — `conventions.md`. «Характеристики» (drag&drop) свідомо лишились з кнопкою — `settings-category-characteristics.md`
- 2026-08-02 — Довідники «Розміри та заміри»/«Тип тканини та матеріал» розділено на окремі плитки («Розміри»/«Заміри», «Тип тканини»/«Матеріали») за прямою вказівкою людини — деталі, файли, історія довідників повністю в новому піддокументі `settings-references.md` (винесено тим самим проходом — старий файл модуля впритул до ліміту розділу 0)
- 2026-07-31 — виправлено баг: `npm run db:seed`, запущений повторно на dev-тенанті з реальними даними, повертав раніше видалені категорії назад. Прибрано сідування категорій із `seed.ts` і `lib/mocks/categories.ts` повністю — таблиця `categories` лишається єдиним джерелом істини

## Відкрито
- [ ] 7 із 9 розділів без вмісту (Вітрина магазину, Загальні, Замовлення, Склади, Доставка, Оплата, Тарифний план) — плейсхолдер-текст «ще в розробці»
- [ ] «Обліковий запис»/«Вихід» у футері сайдбару — поки `href="#"`, немає авторизації (`TODO(auth)`)
- [ ] Основна навігація сайдбару — здебільшого `href="#"`, самі розділи ще не збудовані
- [ ] вибір категорії товару оновлює лише `products.category_id` — старі текстові поля `category`/`category_path` НЕ синхронізуються автоматично (`db.md`)
- [ ] drag-and-drop сортування (`position` у БД уже є, `GripVertical` у UI) — досі лише візуальний
- [ ] «Переглянути» на рядку категорії — декоративна, нема публічної вітрини
- [ ] `tenant_id` для категорій і зображень — тимчасово з dev-константи (`TODO(auth)`)
- [ ] Довідники — див. «Відкрито» в `settings-references.md`
