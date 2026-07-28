# Модуль: products

**Статус:** UI `в роботі` · Логіка `—` · Бек `—` · БД `—`
**Маршрут:** /products/[id]
**Оновлено:** 2026-07-28

## Призначення
Картка товару: загальна інформація, фото, варіанти SKU (колір × розмір), залишки, статистика по товару. За зразком `Image.png`.

## Файли
| Шлях | Роль |
|---|---|
| src/app/products/layout.tsx | layout з сайдбаром для розділу товарів |
| src/app/products/[id]/page.tsx | сторінка картки товару, збирає секції |
| src/components/products/ProductHeader.tsx | хлібні крихти, заголовок, статус, дії |
| src/components/products/ProductTabs.tsx | вкладки (Основне, SKU, Залишки...) |
| src/components/products/ProductInfoPanel.tsx | ліва панель — характеристики товару |
| src/components/products/ProductPhotoGallery.tsx | фото моделі + мініатюри |
| src/components/products/ProductMetaPanel.tsx | права панель — метадані, теги |
| src/components/products/ProductSkuSection.tsx | клієнтський компонент: таблиця SKU + деталі вибраного SKU |
| src/components/products/ProductSkuTable.tsx | таблиця варіантів колір×розмір |
| src/components/products/ProductSkuDetailPanel.tsx | панель деталей вибраного SKU |
| src/components/products/ProductStatsBar.tsx | нижня панель підсумкових метрик |
| src/lib/types/product.ts | типи Product, ProductSku, ProductPhoto |
| src/lib/mocks/products.ts | мокові дані товару |

## Використовує з ui-kit
Sidebar, Button, Badge (variant success), Card, Tabs, Table, DropdownMenu, Tooltip, StatTile, DetailRow

## Дані
Зараз: моки в `src/lib/mocks/products.ts`.
Планово: таблиці `products`, `product_skus` (див. `db.md`) — ще не створені, БД не підключена.

## Доступ
Ролі, яким доступний модуль: owner (поки єдина активна роль).

## Зв'язки
Залежить від: layout (ui-kit, Sidebar)
Від нього залежать: —

## Зроблено
- 2026-07-28 — каркас Next.js + Tailwind + shadcn/ui, палітра й шрифт за `design.md`
- 2026-07-28 — верстка картки товару (шапка, вкладки, інфо-панелі, фото, таблиця SKU, статистика) за зразком `Image.png`, дані на моках

## Відкрито
- [ ] реальні фото (зараз плейсхолдери)
- [ ] логіка вкладок (зараз лише «Основне» наповнена)
- [ ] підключення БД замість моків
- [ ] список товарів (сторінка `/products` без id)
