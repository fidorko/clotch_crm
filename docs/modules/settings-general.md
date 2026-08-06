# Модуль: settings — піддокумент «Загальні»

Частина модуля `settings` (`docs/modules/settings.md`) — винесено окремо за тим самим правилом, що «Оплата»/«Доставка»/«Склади»/«Довідники» (`CLAUDE.md`, розділ 0). Статус/доступ/зв'язки — спільні з `settings.md`, тут немає власного запису в `map.md`.

**Маршрут:** /settings?tab=general

## Призначення
Розділ «Загальні» (сайдбар → Налаштування → Загальні) — за скріном-зразком людини, дві плитки поруч (`grid-cols-[7fr_3fr]`):

- **«Основні дані»** (70% ширини) — назва, сайт, email, контактна особа/посада/телефон (`PhoneInput`), графіки роботи (`WarehouseWorkHoursField`, перевикористано з «Складів» напряму — ui-kit.md, правило 9.2). **Singleton** — один рядок на тенанта (`general_settings`, `tenant_id` сам є PK), **автозбереження** без кнопки «Зберегти» (conventions.md, той самий принцип, що `WarehouseForm`): кожна зміна поля йде в БД через 500мс debounce, `upsertGeneralSettings` створює рядок при першому збереженні.
- **«Мої ФОП та ТОВ»** — список юридичних осіб/ФОП тенанта (`company_legal_entities`): кольорова іконка-абревіатура типу (зелений «ФОП»/синій «ТОВ»), назва, ЄДРПОУ, статус-бейдж (Активний/Неактивний), шеврон. «+» у заголовку картки — створення; **клік по всьому рядку** (не окрема іконка-олівець) відкриває той самий попап редагування (Тип/Назва/ЄДРПОУ/Статус), видалення — кнопка-кошик у футері попапу.

**Свідоме припущення (не підтверджено з людиною):** у запиті описані лише 2 плитки з переліченими полями — повні банківські/юридичні реквізити (рахунок, адреса, система оподаткування тощо), натякнуті словом «реквізитами» в підписі картки й шевроном на зразку-скріні, **не запитувались і не змодельовані**. Клік по рядку компанії відкриває той самий простий попап (тип/назва/ЄДРПОУ/статус), не окрему сторінку реквізитів — відкритий пункт нижче.

## Файли
| Шлях | Роль |
|---|---|
| src/components/settings/GeneralTab.tsx | обгортка розкладки 70/30 — `GeneralInfoCard` + `CompanyLegalEntitiesCard` |
| src/components/settings/GeneralInfoCard.tsx | «Основні дані» (Client Component) — автозбереження debounce, індикатор «Збереження…»/«Збережено» замість кнопки |
| src/components/settings/CompanyLegalEntitiesCard.tsx | «Мої ФОП та ТОВ» (Client Component) — список, кожен рядок повністю клікабельний (не лише іконка), іконка-абревіатура типу (`TYPE_COLOR`/`TYPE_LABEL`) |
| src/components/settings/CompanyLegalEntityFormDialog.tsx | попап create+edit — тип (radio ФОП/ТОВ), назва, ЄДРПОУ (лише цифри), статус (radio), видалення — `ConfirmDeleteIconButton` у футері (лише в режимі редагування) |
| src/components/settings/WarehouseWorkHoursField.tsx | **2 використання** (ui-kit.md, правило 9.2) — «Склади» й тепер «Загальні», без змін коду |
| src/app/settings/general/actions.ts | Server Actions: `saveGeneralSettingsAction` (upsert, валідація email regex), `createCompanyLegalEntityAction`, `updateCompanyLegalEntityAction`, `deleteCompanyLegalEntityAction` |
| src/server/data/general-settings.ts | `getGeneralSettings` (null, поки рядка ще нема), `upsertGeneralSettings` (`onConflictDoUpdate` за `tenant_id`) |
| src/server/data/company-legal-entities.ts | `listCompanyLegalEntities`, `createCompanyLegalEntity`, `updateCompanyLegalEntity`, `deleteCompanyLegalEntity`, дружня помилка на `UNIQUE(tenant_id, edrpou)` (23505) |
| src/server/db/schema/general-settings.ts | таблиця `general_settings` — `tenant_id` сам PK (singleton, не список), `work_hours` jsonb (`GeneralSettingsWorkHourEntry`, та сама форма, що `WarehouseWorkHourEntry`) |
| src/server/db/schema/company-legal-entities.ts | таблиця `company_legal_entities` + pg-enum `company_legal_entity_type` (`fop`/`tov`) |
| src/app/settings/page.tsx | `GeneralSection` — тягне `getGeneralSettings`+`listCompanyLegalEntities`, рендерить `GeneralTab`; `?tab=general` прибрано з `EMPTY_SECTION_TITLES` (більше не плейсхолдер) |

## Дані
`general_settings`+`company_legal_entities` — тенант-скоуповано, RLS. `db.md` (розділи `general_settings`/`company_legal_entities`).

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль) — той самий, що `settings.md`.

## Зв'язки
Залежить від: layout (ui-kit, Sidebar), спільні `PhoneInput`/`WarehouseWorkHoursField`/`ConfirmDeleteIconButton`/`Badge`/`RadioGroup`.
Від нього залежать: `settings-delivery.md` — кожен `company_legal_entities`-рядок одразу отримує порожню конфігурацію на кожен спосіб доставки (`seedDeliveryMethodEntitySettingsForLegalEntity`), і саме звідси попап «Доставка» бере перемикач «Юридична особа».

## Зроблено
- 2026-08-06, перший прохід (пряма вказівка людини — скрін-зразок «Мої ФОПи та ТОВ» + опис полів «Основних даних», «графіки роботи як ти робив у складах»): таблиця `general_settings` (singleton, `tenant_id` — PK) + таблиця `company_legal_entities` (CRUD), міграція `0061`. Автозбереження «Основних даних» (той самий принцип, що `WarehouseForm`), CRUD «Моїх ФОП та ТОВ» через попап (тип/назва/ЄДРПОУ/статус). `tsc`/`eslint` чисто. Живою перевіркою headless Playwright підтверджено: заповнення й перезавантаження сторінки повертає ті самі значення (назва/email/телефон/рядок годин роботи) з реальної БД, додавання компанії/зміна типу (ФОП↔ТОВ, колір іконки перемикається)/зміна статусу на неактивний/видалення — усі пройшли без консольних помилок; пряма перевірка через SQL підтвердила порожній стан після очищення тестових даних.

## Відкрито
- [ ] Повні реквізити компанії (юридична адреса, розрахунковий рахунок/IBAN, система оподаткування, директор/підписант) — не запитувались, не змодельовані; клік по рядку зараз відкриває лише спрощений попап (тип/назва/ЄДРПОУ/статус) — потребує звірки з людиною, чи взагалі потрібна окрема сторінка реквізитів
- [ ] ЄДРПОУ — лише «непорожнє поле з цифр», без перевірки довжини (8 для юрособи/10 для ІПН ФОП) чи контрольної суми
- [ ] Жоден інший модуль ще не читає `general_settings`/`company_legal_entities` (напр. друк документів/акту приймання-передачі не підставляє реквізити компанії)
- [ ] `position`/сортування на `company_legal_entities` — колонка є, drag-and-drop не реалізовано (як у «Кольорах»/«Доставці»/«Оплаті»)
