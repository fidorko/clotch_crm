# Модуль: products

**Статус:** UI `в роботі` · Логіка `—` · Бек `—` · БД `—`
**Маршрут:** /products/[id]
**Оновлено:** 2026-07-29 (пошук у замірах, видалення заміру, статистика під табами)

## Призначення
Картка товару: загальна інформація, фото, варіанти SKU (колір × розмір), залишки, статистика по товару. За зразком `Image.png`.

## Файли
| Шлях | Роль |
|---|---|
| src/app/products/layout.tsx | layout з сайдбаром для розділу товарів |
| src/app/products/[id]/page.tsx | сторінка картки товару, збирає секції |
| src/components/products/ProductHeader.tsx | хлібні крихти, заголовок, статус (єдине місце редагування — випадаючий список), дії |
| src/components/products/ProductTabs.tsx | вкладки (Основне, SKU, Залишки...) |
| src/components/products/ProductInfoPanel.tsx | ліва панель — характеристики товару, поля редагуються через випадаючий список |
| src/components/products/ProductPhotoGallery.tsx | фото моделі + мініатюри |
| src/components/products/ProductMetaPanel.tsx | права панель — метадані (редаговані: постачальник, країна бренду/виробник, внутрішній артикул, артикул постачальника, розміри/вага для ТТН, теги, опис) |
| src/components/products/ProductSkuSection.tsx | клієнтський компонент: таблиця SKU + деталі вибраного SKU |
| src/components/products/ProductSkuTable.tsx | таблиця варіантів колір×розмір |
| src/components/products/ProductSkuDetailPanel.tsx | панель деталей вибраного SKU |
| src/components/products/ProductSizeChart.tsx | таблиця «Розмірна сітка» (NT/обхвати/INT/UA-RU/EU), окремий блок під SKU-секцією, ліва колонка ряду (3fr) |
| src/components/products/ProductMeasurements.tsx | картка «Заміри виробу» — рядки «тип заміру (Combobox — пошук по вводу) — значення (Input, см) — видалити»; згортається, «+ Додати ще один замір»; окремий блок, права колонка ряду (2fr) |
| src/components/products/ProductStatsBar.tsx | нижня панель підсумкових метрик |
| src/lib/types/product.ts | типи Product, ProductSku, ProductPhoto |
| src/lib/mocks/products.ts | мокові дані товару |
| src/lib/constants/product-status.ts | єдине джерело статусів товару (значення/лейбл/колір бейджа), використовує і хедер, і мета-панель |
| src/components/dev/DevBlockLabel.tsx | dev-мітка блоку/секції (спільна, ui-kit.md) |
| src/lib/dev/dev-flags.ts | прапорець показу dev-міток по модулях |

## Використовує з ui-kit
Sidebar, Button, Badge (variant success/warning/secondary), Card, Tabs, Table, DropdownMenu (з DropdownMenuCheckboxItem), Tooltip, StatTile, DetailRow, Select, SelectRow, NumberRow, TextRow, Switch, Combobox, Textarea, Input

## Дані
Зараз: моки в `src/lib/mocks/products.ts` (`product.measurements`). Розмірна сітка (`ProductSizeChart.tsx`) — окремо захардкоджена, уніфікована таблиця (не прив'язана до товару чи категорії). Типи замірів (`MEASUREMENT_TYPE_OPTIONS`) — тимчасовий довідник у `ProductMeasurements.tsx`.
Планово: таблиці `products`, `product_skus` (див. `db.md`) — ще не створені, БД не підключена. Розмірна сітка й типи замірів — окремі довідники, ймовірно з прив'язкою до категорії/типу одягу.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: layout (ui-kit, Sidebar)
Від нього залежать: —

## Зроблено
- 2026-07-29 — `ProductMeasurements`: тип заміру тепер обирається через `Combobox` (новий `ui/combobox.tsx`, обгортка над `@base-ui/react/combobox` — той самий стиль, що й `Select`, але з полем пошуку: ввід одразу фільтрує список) замість звичайного `Select`; у кожного рядка додана кнопка видалення (іконка кошика, `Trash2`, `variant="ghost"`). `ProductStatsBar` перенесено з самого низу сторінки одразу під `ProductTabs` (був запит переставити панель метрик вище, ближче до заголовка)
- 2026-07-29 — розмірна сітка вийшла задуже широкою на всю ширину сторінки (розтягнута таблиця з великими проміжками). Винесено з `ProductSkuSection` в окремий рядок на сторінці (`page.tsx`), поруч додано новий блок `ProductMeasurements` («Заміри виробу») — обидва тепер у грід-рядку `3fr_2fr` (та сама пропорція, що й SKU-таблиця + деталі SKU вище), кожен зі своєю `DevBlockLabel`. `ProductMeasurements`: рядки «тип заміру (`Select`, тимчасовий довідник) — значення в см (`Input`)», картка згортається (шеврон, локальний стан), «+ Додати ще один замір» додає новий рядок з дефолтним типом. Новий тип `ProductMeasurement` (`id`, `type`, `valueCm`), поле `product.measurements`. Зразок — скрін користувача, але без банерного заголовка й зебра-смуг оригіналу — рядки на `divide-y`, як і решта карток-панелей проєкту
- 2026-07-29 — додано `ProductSizeChart` — таблиця «Розмірна сітка» (NT-розмір, обхвати грудей/талії/стегон, INT джинси, UA/RU, EU), 9 рядків XS–5XL, під SKU-секцією (`ProductSkuSection`). За зразком-скріном користувача, але без кольорової палітри оригіналу — той самий нейтральний `Table`/`Card`, що й `ProductSkuTable`, щоб не ламати єдиний стиль
- 2026-07-29 — статус товару дублювався в двох місцях (`ProductHeader` — статичний бейдж, `ProductMetaPanel` — редагований `Select`). Прибрано з `ProductMetaPanel` (`StatusSelectRow` видалено), редагування перенесено в `ProductHeader` — той самий `Select` + кольоровий `Badge`-тригер, тепер єдине місце зміни статусу. `ProductHeader` став `"use client"` (локальний стан `status`)
- 2026-07-29 — `ProductMetaPanel`: «Штрихкод моделі» (з генерацією) видалено, замінено на «Внутрішній артикул» і «Артикул постачальника» — обидва вільний текст (`TextRow`, ui-kit, 2 використання), поле розтягнуте до правого краю картки, текст зліва. Тип `Product.meta.modelBarcode` → `internalCode` + `supplierCode`. `ProductSkuSection`: прибрано `items-start` з grid (він вимикав стандартний CSS grid stretch) — `ProductSkuTable` і `ProductSkuDetailPanel` тепер теж однакової висоти (`h-full` на обох `Card`), той самий підхід, що й для трьох верхніх панелей
- 2026-07-29 — `ProductInfoPanel`/`ProductPhotoGallery`/`ProductMetaPanel`: однакова висота карток (`h-full` на `Card`) — причина розбіжності: `DevBlockLabel` рендерить непрозорий wrapper-div навколо кожного блоку, а звичайний block-child не успадковує розтягнуту grid-комірку автоматично (на відміну від самого `Card`, якби він був прямим grid-item). «Країна виробник» і «Опис» перенесено з `ProductInfoPanel` у `ProductMetaPanel` (власний локальний стан, той самий `product.info`); «Щільність» видалено з типу `Product.info` і мока; додано «Колекція» (`Summer 2026`/`Autumn 2026`) в `ProductInfoPanel`. Додано блок цінової політики в `ProductInfoPanel` — Ціна/Закупівельна ціна/Перечеркнута ціна/Знижка % (новий `NumberRow`, ui-kit, 2+ використання) + перемикач «Автоматичний розрахунок націнки» (новий `Switch`, доданий через shadcn CLI). Новий тип `Product.pricing` (`price`, `purchasePrice`, `oldPrice`, `discountPercent`, `autoMarkup`) — поки що незалежний від цін на рівні SKU (`ProductSkuDetailPanel`), не звірявся й не об'єднувався з ними
- 2026-07-29 — `ProductPhotoGallery`: «Додати фото» відкриває вибір файлу (`accept="image/*"`, кілька файлів за раз), нове фото одразу показується у великому прев'ю і мініатюрі через `URL.createObjectURL` (локальний blob, нічого не зберігається на сервері — `object URL` звільняється при розмонтуванні). Заразом полагоджено: велике прев'ю раніше взагалі не залежало від вибраної мініатюри (завжди був статичний плейсхолдер) — тепер показує саме `active` фото; мініатюри й прев'ю рендерять реальний `<img>`, коли `photo.url` заповнений, інакше — плейсхолдер
- 2026-07-29 — фікс: завантажені фото заповнюють порожні слоти-заглушки по порядку (а не додаються в кінець списку, лишаючи порожні заглушки зверху й реальні фото знизу)
- 2026-07-29 — усі секції сторінки (`ProductHeader`, `ProductTabs`, `ProductInfoPanel`, `ProductPhotoGallery`, `ProductMetaPanel`, `ProductSkuSection`, `ProductStatsBar`) обгорнуто `DevBlockLabel` (жовта мітка з назвою + пунктирна рамка), прапорець `DEV_BLOCK_LABELS.products = true` у `lib/dev/dev-flags.ts` — вимкнути, коли статус UI стане `готово`
- 2026-07-29 — SEO-каркас: `products/layout.tsx` отримав `metadata.robots = { index: false, follow: false }` (CRM-дані не індексуються); сторінка товару — `generateMetadata` повертає `title` з `mockProduct.name` (тимчасово однаковий для будь-якого id, замінити на реальні дані разом з підключенням БД); кореневий `layout.tsx` — title template `%s · Clotch CRM`; доданий `src/app/robots.ts` (`disallow: "/"` — публічного контенту ще нема)

## Відкрито
- [ ] цінова політика (`ProductInfoPanel`) і ціни SKU (`ProductSkuDetailPanel`) — два незалежні джерела чисел, не звірені й нічим не пов'язані; вирішити зв'язок, коли підключиться БД
- [ ] реальне збереження фото — зараз лише локальний прев'ю (`blob:`, зникає після перезавантаження сторінки); треба файлове сховище поза webroot + таблиця `product_photos` (`tenant_id`) при підключенні БД
- [ ] логіка вкладок (зараз лише «Основне» наповнена)
- [ ] підключення БД замість моків
- [ ] список товарів (сторінка `/products` без id)
- [ ] `generateMetadata` — замінити `mockProduct.name` на реальний title за `id`, коли з'явиться fetch з БД
- [ ] вимкнути `DEV_BLOCK_LABELS.products` (`lib/dev/dev-flags.ts`), коли статус UI стане `готово`
