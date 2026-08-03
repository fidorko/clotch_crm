import type { Metadata } from "next";
import { WarehouseForm } from "@/components/settings/WarehouseForm";
import { listReferenceItems } from "@/server/data/reference-items";
import { listCurrencies } from "@/server/data/currencies";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Новий склад",
};

export default async function NewWarehousePage() {
  const tenantId = getDevTenantId();
  const [countries, currencies] = await Promise.all([
    listReferenceItems(tenantId, "countries"),
    listCurrencies(tenantId),
  ]);
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <DevBlockLabel name="WarehouseForm" enabled={dev}>
      <WarehouseForm
        warehouse={null}
        countries={countries}
        currencies={currencies.map((c) => ({ code: c.code, symbol: c.symbol }))}
      />
    </DevBlockLabel>
  );
}
