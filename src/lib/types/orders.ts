// Список замовлень — перший прохід, лише мок (CLAUDE.md, «Крок 2»): у БД
// ще нема ні `orders`, ні `customers` (лише suppliers/warehouses/products).
// Статуси/поля продумані за типовим пайплайном малого інтернет-магазину
// одягу (Instagram/сайт → підтвердження → комплектація → відправка Новою
// поштою/Укрпоштою → завершення), орієнтир — сучасні SaaS CRM.

export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "returned";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  new: { label: "Нове", className: "bg-warning/15 text-warning" },
  confirmed: {
    label: "Підтверджено",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  processing: { label: "Комплектується", className: "bg-accent/15 text-accent-foreground" },
  shipped: {
    label: "Відправлено",
    className: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  },
  completed: { label: "Завершено", className: "bg-success/15 text-success" },
  cancelled: { label: "Скасовано", className: "bg-muted text-muted-foreground" },
  returned: { label: "Повернення", className: "bg-destructive/10 text-destructive" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "returned",
];

// Раніше — жорсткий 4-значний enum (мок-прохід). Четвертий прохід — реальний
// список /orders читає тенант-керований довідник payment_statuses (назва+колір,
// settings → Довідники → Системні), не фіксований набір — тому просто {name,color}.
export interface RealPaymentStatus {
  name: string;
  color: string; // HEX, payment_statuses.color
}

// Реальна назва способу доставки (delivery_methods.name, тенант-керований,
// довільний текст) — для відображення в рядку таблиці. null — замовлення без
// обраного способу (orders.deliveryMethodId nullable).
export interface RealDeliveryMethod {
  name: string;
}

// carrierKey — окремо від людської назви вище: лишається фіксованим набором
// (delivery_methods.carrierKey у server/carriers/), потрібен PrintTtnDialog
// нижче для групування «яку кнопку-перевізника показати» (лого/лічильник) —
// не змінюємо, це не про мок, а про реальний carrier.factory.ts.
export type DeliveryMethod = "nova_poshta" | "ukrposhta" | "courier" | "pickup";

export const DELIVERY_METHOD_LABEL: Record<DeliveryMethod, string> = {
  nova_poshta: "Нова пошта",
  ukrposhta: "Укрпошта",
  courier: "Кур'єр",
  pickup: "Самовивіз",
};

// Друк ТТН (маркування посилки) має сенс лише для перевізників, що видають
// реальний трек-номер — кур'єр/самовивіз без ТТН (PrintTtnDialog, orders.md).
export const TTN_PRINTABLE_CARRIERS: DeliveryMethod[] = ["nova_poshta", "ukrposhta"];

// «Дія після друку» — попап «Друк ТТН». Поки що не підключено до реального
// друку (нема API перевізника, orders.md) — застосовується прямо до мок-стану
// замовлень одразу після кліку по кнопці перевізника. changeStatus/notify —
// незалежні чекбокси (можна обидва разом), none — «Нічого не робити»,
// взаємовиключна з ними двома (UI гарантує, не тип): позначення none чистить
// обидва прапорці й блокує їх, зняття none — розблоковує.
export interface PostPrintAction {
  none: boolean;
  changeStatus: boolean;
  status: OrderStatus;
  notify: boolean;
  notifyUser: string;
}

export type OrderSource = "instagram" | "website" | "telegram" | "phone" | "olx";

export const ORDER_SOURCE_LABEL: Record<OrderSource, string> = {
  instagram: "Instagram",
  website: "Сайт",
  telegram: "Telegram",
  phone: "Дзвінок",
  olx: "OLX",
};

export interface OrderCustomer {
  name: string;
  phone: string;
  isReturning: boolean;
}

export interface OrderListItem {
  id: string;
  number: string;
  createdAt: string; // DD.MM.YYYY
  createdAtRelative: string; // "2 год тому" — для підпису під номером
  customer: OrderCustomer;
  itemsSummary: string; // "Сукня «Selin»" — назва першої позиції
  itemsCount: number; // кількість позицій (унікальних SKU)
  totalQuantity: number; // сумарна кількість одиниць
  totalSum: number;
  status: OrderStatus;
  paymentStatus: RealPaymentStatus | null;
  paymentMethod: string;
  deliveryMethod: RealDeliveryMethod | null;
  // Окремо від deliveryMethod.name (людська назва) — для групування
  // «Друк ТТН» (PrintTtnDialog) за лого перевізника, нижче.
  carrierKey: DeliveryMethod | null;
  ttn: string | null;
  city: string;
  warehouse: string | null; // звідки відвантажується — реальна назва складу тенанта, якщо є
  source: OrderSource;
  manager: string;
}

export function formatOrderSum(value: number): string {
  return `${value.toLocaleString("uk-UA")} грн`;
}

// OrderStatus/OrderSource вище навмисно збігаються 1:1 з pg-enum
// orders.status/source (server/db/schema/orders.ts) — той самий пайплайн,
// продуманий для мок-списку /orders, перевикористаний у реальній формі
// /orders/new (orders-new-order-form.md).
