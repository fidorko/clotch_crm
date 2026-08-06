import type { Metadata } from "next";
import { OrderForm } from "@/components/orders/new/OrderForm";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import { listProductSkusCatalog } from "@/server/data/product-skus";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Нове замовлення" };

export default async function NewOrderPage() {
  const tenantId = getDevTenantId();
  const [deliveryMethods, skuCatalog] = await Promise.all([
    listDeliveryMethods(tenantId),
    listProductSkusCatalog(tenantId),
  ]);

  return (
    <OrderForm deliveryMethods={deliveryMethods.filter((m) => m.isEnabled)} skuCatalog={skuCatalog} />
  );
}
