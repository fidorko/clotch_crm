import type { Metadata } from "next";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";
import { listOrdersForList } from "@/server/data/orders";
import { listPaymentStatuses } from "@/server/data/payment-statuses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Замовлення" };

// Четвертий прохід — реальні замовлення замість generateMockOrders (пряма
// вказівка людини: "Список замовлень мокові значення видаляй і виводь уже ті
// що я створив"). paymentStatuses — повний тенант-довідник для фільтра
// "Оплата" (не лише ті, що вже трапились серед замовлень).
export default async function OrdersPage() {
  const tenantId = getDevTenantId();
  const [orders, paymentStatuses] = await Promise.all([listOrdersForList(tenantId), listPaymentStatuses(tenantId)]);

  return (
    <OrdersPageClient orders={orders} paymentStatusOptions={paymentStatuses.map((s) => s.name)} />
  );
}
