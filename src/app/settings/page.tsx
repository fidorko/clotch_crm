import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { ReferencesList } from "@/components/settings/ReferencesList";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { WarehousesTab } from "@/components/settings/WarehousesTab";
import { DeliveryTab } from "@/components/settings/DeliveryTab";
import { PaymentMethodsTab } from "@/components/settings/PaymentMethodsTab";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductCountsByCategory, listCategories } from "@/server/data/categories";
import { listWarehouses } from "@/server/data/warehouses";
import { listColors } from "@/server/data/colors";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import {
  listAllDeliveryMethodEntitySettings,
  listAllDeliveryMethodStatusRules,
} from "@/server/data/delivery-method-entity-settings";
import { listAllPaymentMethodPartialAmounts, listPaymentMethods } from "@/server/data/payment-methods";
import { getGeneralSettings } from "@/server/data/general-settings";
import { listCompanyLegalEntities } from "@/server/data/company-legal-entities";
import { listOrderStatuses } from "@/server/data/order-statuses";
import { listCurrencies } from "@/server/data/currencies";
import { listCustomCharacteristicsWithValues } from "@/server/data/custom-characteristics";
import { listSuppliers } from "@/server/data/suppliers";
import { listReferenceItemsForKinds } from "@/server/data/reference-items";
import { listDictionaryFlags } from "@/server/data/reference-dictionary-flags";
import { listFabricTypesWithDetails } from "@/server/data/fabric-types";
import { listMaterials } from "@/server/data/materials";
import { listCareInstructions } from "@/server/data/care-instructions";
import { listSizeTypesWithValues } from "@/server/data/size-types";
import { listMeasurementTypesWithValues } from "@/server/data/measurement-types";
import { REFERENCE_ITEM_KINDS } from "@/lib/constants/reference-item-kinds";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = {
  title: "Налаштування",
};

// Розділи без вмісту (поки без БД) — той самий список, що раніше був
// вкладками в SettingsTabs; вибір розділу тепер веде другорядне меню сайдбару.
const EMPTY_SECTION_TITLES: Record<string, string> = {
  storefront: "Вітрина магазину",
  orders: "Замовлення",
  plan: "Тарифний план",
};

type PageProps = { searchParams: Promise<{ tab?: string }> };

async function CategoriesSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [categories, productCounts] = await Promise.all([
    listCategories(tenantId),
    getProductCountsByCategory(tenantId),
  ]);
  return (
    <DevBlockLabel name="CategoriesTab" enabled={dev}>
      <CategoriesTab categories={categories} productCounts={productCounts} />
    </DevBlockLabel>
  );
}

async function WarehousesSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const warehouses = await listWarehouses(tenantId);
  return (
    <DevBlockLabel name="WarehousesTab" enabled={dev}>
      <WarehousesTab warehouses={warehouses} />
    </DevBlockLabel>
  );
}

async function DeliverySection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [deliveryMethods, entitySettings, statusRules, legalEntities, orderStatuses] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
    listAllDeliveryMethodStatusRules(tenantId),
    listCompanyLegalEntities(tenantId),
    listOrderStatuses(tenantId),
  ]);
  return (
    <DevBlockLabel name="DeliveryTab" enabled={dev}>
      <DeliveryTab
        deliveryMethods={deliveryMethods}
        entitySettings={entitySettings}
        statusRules={statusRules}
        legalEntities={legalEntities}
        orderStatuses={orderStatuses}
      />
    </DevBlockLabel>
  );
}

async function PaymentSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [paymentMethods, partialAmounts] = await Promise.all([
    listPaymentMethods(tenantId),
    listAllPaymentMethodPartialAmounts(tenantId),
  ]);
  return (
    <DevBlockLabel name="PaymentMethodsTab" enabled={dev}>
      <PaymentMethodsTab paymentMethods={paymentMethods} partialAmounts={partialAmounts} />
    </DevBlockLabel>
  );
}

async function GeneralSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [settings, legalEntities] = await Promise.all([
    getGeneralSettings(tenantId),
    listCompanyLegalEntities(tenantId),
  ]);
  return (
    <DevBlockLabel name="GeneralTab" enabled={dev}>
      <GeneralTab settings={settings} legalEntities={legalEntities} />
    </DevBlockLabel>
  );
}

async function ReferencesSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [
    colors,
    orderStatuses,
    currencies,
    suppliers,
    referenceItemsByKind,
    customCharacteristics,
    dictionaryFlags,
    fabricTypes,
    materials,
    careInstructions,
    sizeTypes,
    measurementTypes,
  ] = await Promise.all([
    listColors(tenantId),
    listOrderStatuses(tenantId),
    listCurrencies(tenantId),
    listSuppliers(tenantId),
    listReferenceItemsForKinds(tenantId, REFERENCE_ITEM_KINDS),
    listCustomCharacteristicsWithValues(tenantId),
    listDictionaryFlags(tenantId, [
      "colors",
      "fabric-materials",
      "materials",
      "care-instructions",
      "sizes",
      "measurements",
    ]),
    listFabricTypesWithDetails(tenantId),
    listMaterials(tenantId),
    listCareInstructions(tenantId),
    listSizeTypesWithValues(tenantId),
    listMeasurementTypesWithValues(tenantId),
  ]);
  const currencyItems = currencies.map((c) => ({ code: c.code, symbol: c.symbol }));
  const supplierItems = suppliers.map((s) => ({ id: s.id, name: s.name }));
  const itemsByKind = Object.fromEntries(
    Object.entries(referenceItemsByKind).map(([kind, rows]) => [
      kind,
      rows.map((row) => ({ id: row.id, name: row.name })),
    ])
  );
  return (
    <DevBlockLabel name="ReferencesList" enabled={dev}>
      <ReferencesList
        colors={colors}
        orderStatuses={orderStatuses}
        currencies={currencyItems}
        suppliers={supplierItems}
        referenceItemsByKind={itemsByKind}
        customCharacteristics={customCharacteristics}
        dictionaryFlags={dictionaryFlags}
        fabricTypes={fabricTypes}
        materials={materials}
        careInstructions={careInstructions}
        sizeTypes={sizeTypes}
        measurementTypes={measurementTypes}
      />
    </DevBlockLabel>
  );
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { tab: rawTab } = await searchParams;
  // Невідоме/відсутнє значення ?tab= тихо трактується як "categories" —
  // URL-параметр ніколи не повинен ламати чи спорожняти сторінку.
  const tab =
    rawTab === "references" ||
    rawTab === "warehouses" ||
    rawTab === "delivery" ||
    rawTab === "payment" ||
    rawTab === "general" ||
    (rawTab && rawTab in EMPTY_SECTION_TITLES)
      ? rawTab
      : "categories";
  const dev = DEV_BLOCK_LABELS.settings;
  const tenantId = getDevTenantId();

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="SettingsHeader" enabled={dev}>
        <SettingsHeader />
      </DevBlockLabel>

      <div className="flex flex-1 flex-col gap-4 p-6">
        {tab === "categories" && <CategoriesSection tenantId={tenantId} dev={dev} />}
        {tab === "references" && <ReferencesSection tenantId={tenantId} dev={dev} />}
        {tab === "warehouses" && <WarehousesSection tenantId={tenantId} dev={dev} />}
        {tab === "delivery" && <DeliverySection tenantId={tenantId} dev={dev} />}
        {tab === "payment" && <PaymentSection tenantId={tenantId} dev={dev} />}
        {tab === "general" && <GeneralSection tenantId={tenantId} dev={dev} />}
        {tab in EMPTY_SECTION_TITLES && (
          <p className="text-sm text-muted-foreground">
            Розділ «{EMPTY_SECTION_TITLES[tab]}» ще в розробці.
          </p>
        )}
      </div>
    </div>
  );
}
