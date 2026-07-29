# UI Kit

Базові компоненти — shadcn/ui (`src/components/ui/`), обгортка над Base UI. Композиція тригерів — через проп `render`, не `asChild` (це API з Radix, тут не працює і ламає гідрацію).

## Базові (shadcn)
| Компонент | Файл | Нотатки |
|---|---|---|
| Button | ui/button.tsx | variants: default, outline, secondary, ghost, destructive, link |
| Switch | ui/switch.tsx | тумблер (`@base-ui/react/switch`), контрольований `checked`/`onCheckedChange`; рендериться як `<span role="switch">`, не `<button>` |
| Dialog | ui/dialog.tsx | модальне вікно (`@base-ui/react/dialog`, доданий через shadcn CLI): `DialogTrigger` (composable через `render` — можна обгорнути `Button`), `DialogContent` (за замовч. `sm:max-w-sm`, оверрайдити класом під ширший вміст), `DialogHeader`/`DialogTitle`, `DialogFooter`. Хрестик закриття — вбудований (`showCloseButton`) |
| Combobox | ui/combobox.tsx | `Select` із пошуком по вводу (`@base-ui/react/combobox`): `ComboboxInputGroup` (`ComboboxInput` + `ComboboxTrigger`) + `ComboboxContent` (`ComboboxItem`, вбудований `Empty` — «Нічого не знайдено»). `items` на `Combobox` — повний список, фільтрація вбудована. Той самий стиль полів/попапу, що й `Select` |
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
| DetailRow | ui/detail-row.tsx | рядок «лейбл — значення»; `align="right"` (за замовч.) — значення притиснуте праворуч, для вузьких колонок (деталі SKU); `align="left"` — фіксована ширина лейбла (`w-40`), значення зліва одразу після — для широких карток-панелей (`ProductMetaPanel`), як на зразку `Image.png` |
| Sidebar | layout/Sidebar.tsx | вузький сайдбар з іконками, активний пункт підсвічено accent-кольором |
| Select | ui/select.tsx | shadcn/base-ui випадаючий список; в inline-рядках (напр. `ProductInfoPanel`) trigger стилізується без рамки (`border-transparent`, `hover:border-input`), щоб виглядати як звичайний текст до наведення |
| SelectRow | ui/select-row.tsx | рядок «лейбл (фіксована ширина `w-40`) — inline `Select` зліва одразу після» (без рамки до наведення); винесено з `ProductInfoPanel`, коли той самий патерн знадобився в `ProductMetaPanel` — 2+ використання = ui-kit (правило 9.2 CLAUDE.md) |
| DevBlockLabel | dev/DevBlockLabel.tsx | dev-режим: обгортка блоку/секції сторінки, показує жовту мітку з назвою компонента + пунктирну рамку, поки UI модуля `в роботі`. Прапорець на модуль — `lib/dev/dev-flags.ts`. Деталі — `conventions.md` |
| NumberRow | ui/number-row.tsx | рядок «лейбл (`w-40`) — числове поле + суфікс» (`h-7 w-20`, `text-right`, компактне, без розтягування на всю ширину — той самий патерн, що й `PackageDimensionsRow`/`PriceModeRow`/`PurchasePriceRow`, всі з однаковою шириною поля); зараз єдине використання — «Перечеркнута ціна» в `ProductInfoPanel` |
| TextRow | ui/text-row.tsx | рядок «лейбл (`w-40`) — текстове поле», поле розтягнуте до правого краю (`flex-1`), текст зліва — вільний ввід без довідника (артикули в `ProductMetaPanel`, 2 використання) |
| PriceModeRow | ui/price-mode-row.tsx | рядок «лейбл — числове поле — перемикач Грн/%». У режимі `%` показує обчислене значення (`= X.XX грн`, формула передається пропом `computeFromPercent`) — сам компонент нічого не знає про базу розрахунку. Опційний проп `warning` — червоний текст під рядком. Цінова політика `ProductInfoPanel`, 4 використання |

## Палітра й тема
Див. `design.md`. Кольори підключені як CSS-змінні в `src/app/globals.css` (`:root` світла, `.dark` темна), додано `--success`/`--success-foreground` поза стандартним набором shadcn.

## Шрифт
Inter (`--font-sans`), підключено з підтримкою кирилиці в `src/app/layout.tsx`.
