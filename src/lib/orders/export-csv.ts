import {
  DELIVERY_METHOD_LABEL,
  ORDER_SOURCE_LABEL,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  type OrderListItem,
} from "@/lib/types/orders";

// Реальний client-only CSV-експорт (не заглушка, як інші дії в рядку) —
// не потребує беку, працює цілком у браузері (Blob+download).
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const HEADER = [
  "Номер", "Дата", "Клієнт", "Телефон", "Товари", "К-сть", "Сума",
  "Оплата", "Спосіб оплати", "Доставка", "ТТН", "Місто", "Статус", "Канал", "Менеджер",
];

function toRow(order: OrderListItem): string[] {
  return [
    order.number,
    order.createdAt,
    order.customer.name,
    order.customer.phone,
    order.itemsSummary,
    String(order.totalQuantity),
    String(order.totalSum),
    PAYMENT_STATUS_META[order.paymentStatus].label,
    order.paymentMethod,
    DELIVERY_METHOD_LABEL[order.deliveryMethod],
    order.ttn ?? "",
    order.city,
    ORDER_STATUS_META[order.status].label,
    ORDER_SOURCE_LABEL[order.source],
    order.manager,
  ];
}

export function exportOrdersToCsv(orders: OrderListItem[]): void {
  const rows = [HEADER, ...orders.map(toRow)];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  // BOM — інакше Excel ламає кирилицю в CSV.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
