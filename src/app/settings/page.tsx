import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { ReferencesList } from "@/components/settings/ReferencesList";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductCountsByCategory, listCategories } from "@/server/data/categories";
import { listColors } from "@/server/data/colors";
import { listCurrencies } from "@/server/data/currencies";
import { listSuppliers } from "@/server/data/suppliers";
import { listReferenceItemsForKinds } from "@/server/data/reference-items";
import { listTags } from "@/server/data/tags";
import { REFERENCE_ITEM_KINDS } from "@/lib/constants/reference-item-kinds";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = {
  title: "Налаштування",
};

// Розділи без вмісту (поки без БД) — той самий список, що раніше був
// вкладками в SettingsTabs; вибір розділу тепер веде другорядне меню сайдбару.
const EMPTY_SECTION_TITLES: Record<string, string> = {
  storefront: "Вітрина магазину",
  general: "Загальні",
  orders: "Замовлення",
  warehouses: "Склади",
  delivery: "Доставка",
  payment: "Оплата",
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

async function ReferencesSection({ tenantId, dev }: { tenantId: string; dev: boolean }) {
  const [colors, currencies, suppliers, referenceItemsByKind, tags] = await Promise.all([
    listColors(tenantId),
    listCurrencies(tenantId),
    listSuppliers(tenantId),
    listReferenceItemsForKinds(tenantId, REFERENCE_ITEM_KINDS),
    listTags(tenantId),
  ]);
  const currencyItems = currencies.map((c) => ({ code: c.code, symbol: c.symbol }));
  const supplierItems = suppliers.map((s) => ({ id: s.id, name: s.name }));
  const tagItems = tags.map((t) => ({ id: t.id, name: t.label }));
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
        currencies={currencyItems}
        suppliers={supplierItems}
        referenceItemsByKind={itemsByKind}
        tags={tagItems}
      />
    </DevBlockLabel>
  );
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { tab: rawTab } = await searchParams;
  // Невідоме/відсутнє значення ?tab= тихо трактується як "categories" —
  // URL-параметр ніколи не повинен ламати чи спорожняти сторінку.
  const tab =
    rawTab === "references" || (rawTab && rawTab in EMPTY_SECTION_TITLES) ? rawTab : "categories";
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
        {tab in EMPTY_SECTION_TITLES && (
          <p className="text-sm text-muted-foreground">
            Розділ «{EMPTY_SECTION_TITLES[tab]}» ще в розробці.
          </p>
        )}
      </div>
    </div>
  );
}
