import type { Metadata } from "next";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";
import { generateMockOrders } from "@/lib/mocks/orders";
import { listWarehouses } from "@/server/data/warehouses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Замовлення" };

const MOCK_ORDERS_COUNT = 54;

export default async function OrdersPage() {
  const warehouses = await listWarehouses(getDevTenantId());
  const orders = generateMockOrders(
    MOCK_ORDERS_COUNT,
    warehouses.map((w) => w.name)
  );

  return <OrdersPageClient orders={orders} />;
}
