# UI Kit

Базові компоненти — shadcn/ui (`src/components/ui/`), обгортка над Base UI. Композиція тригерів — через проп `render`, не `asChild` (це API з Radix, тут не працює і ламає гідрацію).

## Базові (shadcn)
| Компонент | Файл | Нотатки |
|---|---|---|
| Button | ui/button.tsx | variants: default, outline, secondary, ghost, destructive, link |
| Badge | ui/badge.tsx | variants: default, secondary, destructive, outline, ghost, link, **success** (додано для статусів «Активний», «В наявності») |
| Card | ui/card.tsx | |
| Tabs | ui/tabs.tsx | |
| Table | ui/table.tsx | |
| DropdownMenu | ui/dropdown-menu.tsx | тригер стилізується напряму через `buttonVariants`, без вкладення `<Button>` — уникає подвійного `<button>` |
| Tooltip | ui/tooltip.tsx | обгортка `TooltipProvider` — у `layout.tsx` |
| Avatar, Separator | ui/avatar.tsx, ui/separator.tsx | |

## Власні
| Компонент | Файл | Призначення |
|---|---|---|
| StatTile | ui/stat-tile.tsx | іконка + число + підпис, використано в нижній панелі статистики картки товару |
| DetailRow | ui/detail-row.tsx | рядок «лейбл — значення», використано в info/meta/sku-деталях (3+ місця) |
| Sidebar | layout/Sidebar.tsx | вузький сайдбар з іконками, активний пункт підсвічено accent-кольором |

## Палітра й тема
Див. `design.md`. Кольори підключені як CSS-змінні в `src/app/globals.css` (`:root` світла, `.dark` темна), додано `--success`/`--success-foreground` поза стандартним набором shadcn.

## Шрифт
Inter (`--font-sans`), підключено з підтримкою кирилиці в `src/app/layout.tsx`.
