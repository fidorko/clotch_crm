// Стартові статуси ОПЛАТИ — джерело для db:seed (таблиця `payment_statuses`,
// tenant-скоупована). Пряма вказівка людини (orders-new-order-form.md,
// редизайн /orders/new): 3 значення, «Очікує оплати» — дефолт нового
// замовлення, «Оплачено повністю»/«Оплачено частково» виставляються вручну.
export const mockPaymentStatuses: { name: string; color: string }[] = [
  { name: "Очікує оплати", color: "#F59E0B" },
  { name: "Оплачено повністю", color: "#22C55E" },
  { name: "Оплачено частково", color: "#6366F1" },
];
