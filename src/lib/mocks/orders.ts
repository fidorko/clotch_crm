import { formatDateUa } from "@/lib/date-ua";
import { DEV_USER } from "@/lib/constants/dev-user";
import type {
  DeliveryMethod,
  OrderListItem,
  OrderSource,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types/orders";

// Мок-дані списку замовлень (CLAUDE.md, «Крок 2» — поки що тільки візуал,
// у БД ще нема ні `orders`, ні `customers`). Детерміновано з index-seed
// (mulberry32) — стабільно між рендерами, як `getWarehouseCardMock`, але
// тут потрібно кілька незалежних випадкових значень на запис, тому власний
// маленький PRNG замість одного hashString.
function mulberry32(seed: number) {
  let s = seed | 0;
  return function random() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, options: readonly T[]): T {
  return options[Math.floor(rng() * options.length)];
}

const FIRST_NAMES = [
  "Олена", "Марія", "Ірина", "Наталія", "Катерина", "Анна", "Тетяна", "Юлія",
  "Вікторія", "Софія", "Дмитро", "Олександр", "Андрій", "Максим", "Ігор",
  "Богдан", "Роман", "Артем", "Владислав", "Микола",
] as const;

const LAST_NAMES = [
  "Коваленко", "Шевченко", "Бондаренко", "Ткаченко", "Кравчук", "Олійник",
  "Мельник", "Гончаренко", "Поліщук", "Савченко",
] as const;

const CITIES = [
  "Київ", "Львів", "Одеса", "Харків", "Дніпро", "Вінниця", "Полтава",
  "Івано-Франківськ", "Чернігів", "Запоріжжя", "Тернопіль", "Хмельницький",
] as const;

const CLOTHING_ITEMS = [
  "Сукня «Selin»", "Блуза «Marie»", "Спідниця «Cora»", "Костюм «Vera»",
  "Плаття «Ліна»", "Жакет «Одрі»", "Штани «Ніка»", "Светр «Мія»",
  "Топ «Есме»", "Пальто «Флора»", "Комбінезон «Рена»", "Кардиган «Айла»",
] as const;

const PAYMENT_METHODS = [
  "Накладений платіж", "Передоплата на карту", "Онлайн-оплата", "Оплата частинами",
] as const;

const ORDER_STATUS_POOL: OrderStatus[] = [
  "new", "new", "confirmed", "confirmed", "processing", "processing",
  "shipped", "shipped", "completed", "completed", "completed", "cancelled", "returned",
];

const DELIVERY_METHOD_POOL: DeliveryMethod[] = [
  "nova_poshta", "nova_poshta", "nova_poshta", "ukrposhta", "courier", "pickup",
];

const SOURCE_POOL: OrderSource[] = [
  "instagram", "instagram", "website", "website", "telegram", "phone", "olx",
];

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дні";
  return "днів";
}

function formatRelative(minutesAgo: number): string {
  if (minutesAgo < 60) return `${Math.max(1, minutesAgo)} хв тому`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "учора";
  return `${days} ${pluralDays(days)} тому`;
}

function generateTtn(rng: () => number): string {
  let digits = "";
  for (let i = 0; i < 14; i++) digits += Math.floor(rng() * 10);
  return digits;
}

export function generateMockOrders(count: number, warehouseNames: string[]): OrderListItem[] {
  const now = Date.now();
  const orders: OrderListItem[] = [];

  for (let i = 0; i < count; i++) {
    const rng = mulberry32(i * 7919 + 1000);

    const status = pick(rng, ORDER_STATUS_POOL);
    const paymentStatus: PaymentStatus =
      status === "cancelled"
        ? "unpaid"
        : status === "returned"
          ? "refunded"
          : status === "completed"
            ? "paid"
            : pick(rng, ["unpaid", "partial", "paid", "paid"] as const);

    const minutesAgo = i * 180 + Math.floor(rng() * 150);
    const createdDate = new Date(now - minutesAgo * 60_000);

    const itemsCount = 1 + Math.floor(rng() * 3);
    const totalQuantity = itemsCount + Math.floor(rng() * 2);
    const unitPrice = 550 + Math.floor(rng() * 1800);
    const totalSum = unitPrice * totalQuantity;

    const deliveryMethod = pick(rng, DELIVERY_METHOD_POOL);
    const hasWarehouse = warehouseNames.length > 0;

    orders.push({
      id: `mock-order-${i}`,
      number: `ORD-2026-${String(20000 - i).padStart(5, "0")}`,
      createdAt: formatDateUa(createdDate) ?? "",
      createdAtRelative: formatRelative(minutesAgo),
      customer: {
        name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
        phone: `+380 ${String(50 + Math.floor(rng() * 49)).padStart(2, "0")} ${String(
          Math.floor(rng() * 1000)
        ).padStart(3, "0")} ${String(Math.floor(rng() * 100)).padStart(2, "0")} ${String(
          Math.floor(rng() * 100)
        ).padStart(2, "0")}`,
        isReturning: rng() > 0.6,
      },
      itemsSummary: pick(rng, CLOTHING_ITEMS),
      itemsCount,
      totalQuantity,
      totalSum,
      status,
      paymentStatus,
      paymentMethod: pick(rng, PAYMENT_METHODS),
      deliveryMethod,
      ttn: deliveryMethod === "nova_poshta" || deliveryMethod === "ukrposhta" ? generateTtn(rng) : null,
      city: pick(rng, CITIES),
      warehouse: hasWarehouse ? pick(rng, warehouseNames) : null,
      source: pick(rng, SOURCE_POOL),
      manager: DEV_USER.name,
    });
  }

  return orders;
}
