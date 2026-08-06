# Модуль: settings — піддокумент «Оплата»

Частина модуля `settings` (`docs/modules/settings.md`) — винесено окремо за тим самим правилом, що «Доставка»/«Склади»/«Довідники» (`CLAUDE.md`, розділ 0). Статус/доступ/зв'язки — спільні з `settings.md`, тут немає власного запису в `map.md`.

**Маршрут:** /settings?tab=payment

## Призначення
Розділ «Оплата» (сайдбар → Налаштування → Оплата) — плоский список способів оплати тенанта, той самий UI-патерн, що «Доставка» (`settings-delivery.md`): вмикач (Switch), назва + іконка, статус-бейдж, олівець (редагування), кошик (видалення, з підтвердженням), «+ Додати спосіб оплати».

**4 системні варіанти**, засіяні одразу за прямою вказівкою людини (2026-08-06):
- **Оплата по реквізитах** (`bank_transfer`)
- **Оплата карткою на сайті** (`card_online`)
- **Часткова оплата** (`partial_payment`) — **кілька варіантів фіксованої суми** (2026-08-06, другий прохід, пряма вказівка людини: «щоб можна було ввести декілька варіантів сум, а потім відповідно можна було вибрати»), repeatable-список у попапі (`PaymentMethodPartialAmountsField.tsx`, «+Додати варіант суми»). Клієнт вносить одну з цих сум одразу; **суми плануються для розрахунку решти при грошовому переказі при отриманні, а сам вибір потрібного варіанта при оформленні замовлення ще не реалізовані** — лише зберігається конфігурація.
- **Оплата при отриманні** (`cash_on_delivery`)

Назва системних варіантів **не редагується** в попапі (`SYSTEM_PAYMENT_METHOD_KINDS`, той самий підхід, що `SYSTEM_CARRIER_KEYS` у «Доставці») — лише вмикач/варіанти суми (де застосовно). **Можна додати власний варіант** («+ Додати спосіб оплати») — завжди `kind="custom"` (`createPaymentMethodAction` ігнорує будь-який інший kind із форми), вільна назва.

**Статус — обчислюється, не зберігається:** «Не активний» (вимкнено), «Потрібні суми» (kind=`partial_payment`, увімкнено, жодного варіанта суми ще не задано), «Активний» (інакше) — `statusOf()` у `PaymentMethodsTab.tsx`, той самий принцип, що `DeliveryTab.tsx`.

**Усе перелічене — лише конфігурація/зберігання:** жодна логіка оформлення замовлення (вибір способу оплати, вибір конкретного варіанта суми, реальний розрахунок суми грошового переказу для «Часткової оплати») ще не читає цю таблицю — форма замовлення (`orders.md`) поки на власному хардкод-списку `ORDER_PAYMENT_METHOD_OPTIONS`.

## Файли
| Шлях | Роль |
|---|---|
| src/components/settings/PaymentMethodsTab.tsx | список (Client Component) — Switch/Badge/Pencil/Trash на рядок, іконка kind (`PAYMENT_METHOD_KIND_ICONS`) поруч з назвою, усі варіанти суми часткової оплати праворуч від назви через « / », якщо задані. `statusOf()` — обчислення статусу з кількості пов'язаних варіантів суми |
| src/components/settings/PaymentMethodFormDialog.tsx | попап create+edit (`sm:max-w-md`, набагато простіший за `DeliveryMethodFormDialog` — нема зовнішнього API): назва (disabled для системних), `PaymentMethodPartialAmountsField` (лише коли `kind==="partial_payment"`) |
| src/components/settings/PaymentMethodPartialAmountsField.tsx | repeatable-список варіантів суми (той самий UI-патерн, що правила статусів у `DeliveryMethodAutomationFields.tsx`) — рядок `DecimalInput`+кошик, «+Додати варіант суми» знизу |
| src/lib/constants/payment-methods.ts | `SYSTEM_PAYMENT_METHOD_KINDS` (4 системні kind, чия назва не редагується) + `PAYMENT_METHOD_KIND_ICONS` (lucide-іконка на kind — `Landmark`/`CreditCard`/`SplitSquareHorizontal`/`Wallet`/`Banknote` для custom) |
| src/app/settings/payment/actions.ts | Server Actions: `createPaymentMethodAction` (завжди `kind="custom"`), `updatePaymentMethodAction`, `togglePaymentMethodAction` (швидкий тогл зі списку — читає й пише назад поточні варіанти суми, щоб не стерти їх), `deletePaymentMethodAction`. `parsePaymentMethodInput` відсіює порожні/дублікатні суми ще до БД |
| src/server/data/payment-methods.ts | `listPaymentMethods`, `listAllPaymentMethodPartialAmounts` (усі варіанти тенанта одним запитом, як `listAllDeliveryMethodStatusRules`), `createPaymentMethod`/`updatePaymentMethod` (одна транзакція: upsert методу + delete-then-insert варіантів суми, `replacePartialAmounts`), `deletePaymentMethod`, дружня помилка на `UNIQUE(tenant_id, name)` (23505) |
| src/server/db/schema/payment-methods.ts | таблиця `payment_methods` (+ pg-enum `payment_method_kind`) і таблиця `payment_method_partial_amounts` («метод → 0..N сум», `ON DELETE CASCADE`) |
| src/lib/mocks/payment-methods.ts | 4 системні способи для `db:seed` — без варіантів суми (людина задає їх сама через UI) |
| src/server/db/seed-payment-methods.ts | окрема функція сідування (той самий прийом, що `seed-delivery-methods.ts`) — `onConflictDoNothing`, ідемпотентно |
| src/app/settings/page.tsx | `PaymentSection` — тягне `listPaymentMethods`+`listAllPaymentMethodPartialAmounts`, рендерить `PaymentMethodsTab`; `?tab=payment` прибрано з `EMPTY_SECTION_TITLES` (більше не плейсхолдер) |

## Дані
`payment_methods`+`payment_method_partial_amounts` — тенант-скоуповано, RLS. `db.md` (розділи `payment_methods`/`payment_method_partial_amounts`).

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль) — той самий, що `settings.md`.

## Зв'язки
Залежить від: layout (ui-kit, Sidebar), спільні `ConfirmDeleteIconButton`/`Switch`/`Badge`/`DecimalInput`.
Від нього залежать: — (форма замовлення ще на моках, `orders.md` — вибір способу оплати там ще не читає цю таблицю).

## Зроблено
- 2026-08-06, другий прохід (пряма вказівка людини — «сума часткової оплати зроби щоб можна було ввести декілька варіантів сум а потім відповідно можна було вибрати»): одне поле `partial_amount` на `payment_methods` замінено окремою таблицею `payment_method_partial_amounts` (той самий repeatable-список патерн, що `delivery_method_status_rules`) — міграція `0060` (DROP COLUMN + CREATE TABLE, без ambiguous-rename). Попап отримав `PaymentMethodPartialAmountsField` (список рядків з кошиком + «Додати варіант суми»), список — суми через « / ». `tsc`/`eslint` чисто. Живою перевіркою headless Playwright підтверджено: додано 3 варіанти (200/400/600 грн), збережено й прочитано назад з реальної БД коректно (список показав усі 3, попап при повторному відкритті — усі 3 з правильними значеннями), видалення одного варіанта зі списку форми зберігається окремо; UNIQUE `(tenant_id, payment_method_id, amount)` не зачеплено (дублікати відсіюються ще в `parsePaymentMethodInput`); тестові суми видалено одразу після перевірки.
- 2026-08-06, перший прохід (пряма вказівка людини — «зроби сторінку Налаштувань способи оплати в стилі сторінки способів доставки, реальну, з БД, і одразу системні варіанти»): таблиця `payment_methods` (міграція `0059`), CRUD (список/створення/редагування/видалення), 4 системні способи засіяно (Оплата по реквізитах/Оплата карткою на сайті/Часткова оплата/Оплата при отриманні). `tsc`/`eslint` чисто. Живою перевіркою headless Playwright підтверджено: 4 рядки рендеряться, назва системного способу (`bank_transfer`) справді `disabled`, додавання власного способу («Оплата у розстрочку») і його видалення відпрацьовують без консольних помилок; тестові значення видалено одразу після перевірки.

## Відкрито
- [ ] Форма замовлення (`orders.md`, ще на моках) не читає цю таблицю — вибір способу оплати й конкретного варіанта суми при оформленні не підключено, там власний хардкод-список `ORDER_PAYMENT_METHOD_OPTIONS`
- [ ] Реальний розрахунок суми грошового переказу при отриманні (замовлення мінус обрана сума часткової оплати) — не реалізовано, лише зберігаються самі варіанти сум у конфігурації способу
- [ ] `position`/сортування — колонка є на обох таблицях, drag-and-drop не реалізовано (як у «Кольорах»/«Доставці»)
