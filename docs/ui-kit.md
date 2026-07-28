# UI Kit

Базові компоненти — shadcn/ui (`src/components/ui/`), обгортка над Base UI. Композиція тригерів — через проп `render`, не `asChild` (це API з Radix, тут не працює і ламає гідрацію).

## Базові (shadcn)
| Компонент | Файл | Нотатки |
|---|---|---|
| Button | ui/button.tsx | variants: default, outline, secondary, ghost, destructive, link |
| Badge | ui/badge.tsx | variants: default, secondary, destructive, outline, ghost, link, **success** (статуси «Активний», «В наявності»), **warning** (статус «Не активний», токен `--warning` в globals.css) |
| Card | ui/card.tsx | |
| Tabs | ui/tabs.tsx | |
| Table | ui/table.tsx | |
| DropdownMenu | ui/dropdown-menu.tsx | тригер стилізується напряму через `buttonVariants`, без вкладення `<Button>` — уникає подвійного `<button>`. `DropdownMenuCheckboxItem` за замовчуванням не закриває меню при кліку (`closeOnClick={false}`) — зручно для мультивибору (напр. інструкції по догляду в `ProductInfoPanel`). **`DropdownMenuLabel` завжди має бути всередині `DropdownMenuGroup`** — інакше base-ui кидає рантайм-помилку «MenuGroupContext is missing» одразу при відкритті меню (ловили баг: чекбокси не реагували на клік саме через це) |
| Tooltip | ui/tooltip.tsx | обгортка `TooltipProvider` — у `layout.tsx` |
| Avatar, Separator | ui/avatar.tsx, ui/separator.tsx | |
| Textarea | ui/textarea.tsx | багаторядкове поле, автовисота через `field-sizing-content` |
| Input | ui/input.tsx | однорядкове поле; в компактних рядках (напр. розміри для ТТН) стилізується меншим (`h-7`, `text-right`) |

**Фокус на полях уводу (Input/Textarea/Select):** без синього кільця/рамки — правило зафіксовано в `design.md` і вбудоване прямо в базові класи цих трьох компонентів (`focus-visible:border-muted-foreground/40`, без `ring`). Не оверрайдь focus-стиль на інстансах.

## Власні
| Компонент | Файл | Призначення |
|---|---|---|
| StatTile | ui/stat-tile.tsx | іконка + число + підпис, використано в нижній панелі статистики картки товару |
| DetailRow | ui/detail-row.tsx | рядок «лейбл — значення», використано в info/meta/sku-деталях (3+ місця) |
| Sidebar | layout/Sidebar.tsx | вузький сайдбар з іконками, активний пункт підсвічено accent-кольором |
| Select | ui/select.tsx | shadcn/base-ui випадаючий список; в inline-рядках (напр. `ProductInfoPanel`) trigger стилізується без рамки (`border-transparent`, `hover:border-input`), щоб виглядати як звичайний текст до наведення |
| SelectRow | ui/select-row.tsx | рядок «лейбл — inline `Select`» (без рамки до наведення); винесено з `ProductInfoPanel`, коли той самий патерн знадобився в `ProductMetaPanel` — 2+ використання = ui-kit (правило 9.2 CLAUDE.md) |

## Палітра й тема
Див. `design.md`. Кольори підключені як CSS-змінні в `src/app/globals.css` (`:root` світла, `.dark` темна), додано `--success`/`--success-foreground` поза стандартним набором shadcn.

## Шрифт
Inter (`--font-sans`), підключено з підтримкою кирилиці в `src/app/layout.tsx`.
