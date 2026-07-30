import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { ReferencesList } from "@/components/settings/ReferencesList";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductCountsByCategory, listCategories } from "@/server/data/categories";
import { listColors } from "@/server/data/colors";
import { listSuppliers } from "@/server/data/suppliers";
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
  const [colors, suppliers] = await Promise.all([listColors(tenantId), listSuppliers(tenantId)]);
  return (
    <DevBlockLabel name="ReferencesList" enabled={dev}>
      <ReferencesList colors={colors} suppliers={suppliers} />
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
