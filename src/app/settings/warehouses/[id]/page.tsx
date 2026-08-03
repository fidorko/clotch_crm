import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WarehouseForm } from "@/components/settings/WarehouseForm";
import { getWarehouseById } from "@/server/data/warehouses";
import { listStreets } from "@/server/data/warehouse-bin-locations";
import { listReferenceItems } from "@/server/data/reference-items";
import { listCurrencies } from "@/server/data/currencies";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const warehouse = await getWarehouseById(getDevTenantId(), id);
  return { title: warehouse?.name ?? "Склад не знайдено" };
}

export default async function EditWarehousePage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = getDevTenantId();
  const [warehouse, countries, currencies, streets] = await Promise.all([
    getWarehouseById(tenantId, id),
    listReferenceItems(tenantId, "countries"),
    listCurrencies(tenantId),
    listStreets(tenantId, id),
  ]);

  if (!warehouse) notFound();
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <DevBlockLabel name="WarehouseForm" enabled={dev}>
      <WarehouseForm
        warehouse={warehouse}
        countries={countries}
        currencies={currencies.map((c) => ({ code: c.code, symbol: c.symbol }))}
        initialStreets={streets}
      />
    </DevBlockLabel>
  );
}
