// Дані сторінки «Надходження» (src/app/warehouse/receiving) — модуля
// «Надходження/приймання товару» на складі ще немає в БД (нема таблиць
// поставок/накладних), тому все нижче — мок за зразком-скріном людини.
// Коли з'явиться реальний бекенд — ці типи стануть орієнтиром для схеми.
export type ReceivingStatus = "accepted" | "partial" | "not_accepted";

export interface ReceivingLineItem {
  id: string;
  sku: string;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  ordered: number;
  received: number;
  cell: string | null;
  status: ReceivingStatus;
}

export const RECEIVING_STATUS_META: Record<
  ReceivingStatus,
  { label: string; badge: "success" | "warning" | "destructive" }
> = {
  accepted: { label: "Прийнято", badge: "success" },
  partial: { label: "Частково", badge: "warning" },
  not_accepted: { label: "Не прийнято", badge: "destructive" },
};

export const MOCK_RECEIVING_ITEMS: ReceivingLineItem[] = [
  {
    id: "1",
    sku: "HOOD-BLK-L",
    productName: "Худі базове",
    color: "Чорний",
    colorHex: "#18181B",
    size: "L",
    ordered: 20,
    received: 20,
    cell: "A-01-01",
    status: "accepted",
  },
  {
    id: "2",
    sku: "HOOD-GRY-M",
    productName: "Худі базове",
    color: "Сірий",
    colorHex: "#9CA3AF",
    size: "M",
    ordered: 15,
    received: 10,
    cell: "A-01-02",
    status: "partial",
  },
  {
    id: "3",
    sku: "HOOD-WHT-L",
    productName: "Худі базове",
    color: "Білий",
    colorHex: "#FFFFFF",
    size: "L",
    ordered: 10,
    received: 10,
    cell: "A-01-02",
    status: "accepted",
  },
  {
    id: "4",
    sku: "TSHIRT-BLK-M",
    productName: "Футболка",
    color: "Чорний",
    colorHex: "#18181B",
    size: "M",
    ordered: 30,
    received: 30,
    cell: "A-02-01",
    status: "accepted",
  },
  {
    id: "5",
    sku: "TSHIRT-WHT-M",
    productName: "Футболка",
    color: "Білий",
    colorHex: "#FFFFFF",
    size: "M",
    ordered: 25,
    received: 15,
    cell: "A-02-02",
    status: "partial",
  },
  {
    id: "6",
    sku: "TSHIRT-NVY-L",
    productName: "Футболка",
    color: "Темно-синій",
    colorHex: "#1E3A8A",
    size: "L",
    ordered: 20,
    received: 0,
    cell: null,
    status: "not_accepted",
  },
  {
    id: "7",
    sku: "PANTS-BEG-32",
    productName: "Штани карго",
    color: "Бежевий",
    colorHex: "#D9C4A3",
    size: "32",
    ordered: 15,
    received: 15,
    cell: "A-03-01",
    status: "accepted",
  },
  {
    id: "8",
    sku: "PANTS-BLK-34",
    productName: "Штани карго",
    color: "Чорний",
    colorHex: "#18181B",
    size: "34",
    ordered: 10,
    received: 0,
    cell: null,
    status: "not_accepted",
  },
];

export const MOCK_BIN_CELLS = [
  "A-01-01",
  "A-01-02",
  "A-01-03",
  "A-02-01",
  "A-02-02",
  "A-03-01",
  "A-03-02",
];

export const MOCK_SUPPLIERS = ['ТОВ "Стиль ОПТ"', 'ФОП Коваленко', 'ТОВ "ТекстильГруп"'];

export const MOCK_RESPONSIBLE_PEOPLE = ["Іваненко Іван", "Ковальчук Оксана", "Петренко Дмитро"];

export const MOCK_LAST_SCAN = {
  sku: "HOOD-BLK-L",
  productName: "Худі базове",
  color: "Чорний",
  size: "L",
  time: "10:24:15",
};

export const MOCK_RECEIVING_PROGRESS = {
  receivedUnits: 100,
  expectedUnits: 145,
  fillPercent: 72,
};

export const MOCK_DISCREPANCIES_COUNT = 2;
