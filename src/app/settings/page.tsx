import type { Metadata } from "next";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ReferencesList } from "@/components/settings/ReferencesList";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { getProductCountsByCategory, listCategories } from "@/server/data/categories";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = {
  title: "Налаштування",
};

export default async function SettingsPage() {
  const dev = DEV_BLOCK_LABELS.settings;
  const tenantId = getDevTenantId();
  const [categories, productCounts] = await Promise.all([
    listCategories(tenantId),
    getProductCountsByCategory(tenantId),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="SettingsHeader" enabled={dev}>
        <SettingsHeader />
      </DevBlockLabel>
      <Tabs defaultValue="categories" className="flex flex-1 flex-col">
        <DevBlockLabel name="SettingsTabs" enabled={dev}>
          <SettingsTabs />
        </DevBlockLabel>

        <TabsContent value="categories" className="flex flex-col gap-4 p-6">
          <DevBlockLabel name="CategoriesTab" enabled={dev}>
            <CategoriesTab categories={categories} productCounts={productCounts} />
          </DevBlockLabel>
        </TabsContent>

        <TabsContent value="references" className="flex flex-col gap-4 p-6">
          <DevBlockLabel name="ReferencesList" enabled={dev}>
            <ReferencesList />
          </DevBlockLabel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
