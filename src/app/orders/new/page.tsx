import type { Metadata } from "next";
import { OrderForm } from "@/components/orders/new/OrderForm";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import {
  listAllDeliveryMethodEntitySettings,
  type DeliveryMethodEntitySettingsRow,
} from "@/server/data/delivery-method-entity-settings";
import { listCompanyLegalEntities } from "@/server/data/company-legal-entities";
import { listProductSkusCatalog } from "@/server/data/product-skus";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Нове замовлення" };

export default async function NewOrderPage() {
  const tenantId = getDevTenantId();
  const [deliveryMethods, skuCatalog, entitySettings, legalEntities] = await Promise.all([
    listDeliveryMethods(tenantId),
    listProductSkusCatalog(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
    listCompanyLegalEntities(tenantId),
  ]);

  // TODO(legal-entity-routing): вибір юридичної особи на замовленні ще не
  // реалізований (settings-delivery.md) — форма поки бере налаштування
  // доставки першої юридичної особи тенанта.
  const firstLegalEntityId = legalEntities[0]?.id;
  const entitySettingsByMethodId: Record<string, DeliveryMethodEntitySettingsRow> = {};
  for (const s of entitySettings) {
    if (s.legalEntityId === firstLegalEntityId) entitySettingsByMethodId[s.deliveryMethodId] = s;
  }

  return (
    <OrderForm
      deliveryMethods={deliveryMethods.filter((m) => m.isEnabled)}
      entitySettingsByMethodId={entitySettingsByMethodId}
      skuCatalog={skuCatalog}
    />
  );
}
