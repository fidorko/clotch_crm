import type { Metadata } from "next";
import { OrderForm } from "@/components/orders/new/OrderForm";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import { listAllDeliveryMethodEntitySettings } from "@/server/data/delivery-method-entity-settings";
import { listCompanyLegalEntities } from "@/server/data/company-legal-entities";
import { listProductSkusCatalog } from "@/server/data/product-skus";
import { listWarehouses } from "@/server/data/warehouses";
import { listAllPaymentMethodPartialAmounts, listPaymentMethods } from "@/server/data/payment-methods";
import { listPaymentStatuses } from "@/server/data/payment-statuses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Нове замовлення" };

export default async function NewOrderPage() {
  const tenantId = getDevTenantId();
  const [
    deliveryMethods,
    skuCatalog,
    entitySettings,
    legalEntities,
    warehouses,
    paymentMethods,
    partialAmounts,
    paymentStatuses,
  ] = await Promise.all([
    listDeliveryMethods(tenantId),
    listProductSkusCatalog(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
    listCompanyLegalEntities(tenantId),
    listWarehouses(tenantId),
    listPaymentMethods(tenantId),
    listAllPaymentMethodPartialAmounts(tenantId),
    listPaymentStatuses(tenantId),
  ]);

  return (
    <OrderForm
      deliveryMethods={deliveryMethods.filter((m) => m.isEnabled)}
      entitySettings={entitySettings}
      legalEntities={legalEntities.filter((e) => e.isActive)}
      skuCatalog={skuCatalog}
      warehouses={warehouses}
      paymentMethods={paymentMethods.filter((m) => m.isEnabled)}
      partialAmounts={partialAmounts}
      paymentStatuses={paymentStatuses}
    />
  );
}
