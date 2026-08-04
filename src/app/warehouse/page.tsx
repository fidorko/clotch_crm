import type { Metadata } from "next";
import { WarehouseHeader } from "@/components/warehouse/WarehouseHeader";
import { WarehouseGrid } from "@/components/warehouse/WarehouseGrid";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { listWarehouses } from "@/server/data/warehouses";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Склад" };

export default async function WarehousePage() {
  const tenantId = getDevTenantId();
  const warehouses = await listWarehouses(tenantId);
  const dev = DEV_BLOCK_LABELS.warehouse;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="WarehouseHeader" enabled={dev}>
        <WarehouseHeader total={warehouses.length} />
      </DevBlockLabel>

      <DevBlockLabel name="WarehouseGrid" enabled={dev}>
        <div className="flex flex-1 flex-col p-6">
          <WarehouseGrid warehouses={warehouses} />
        </div>
      </DevBlockLabel>
    </div>
  );
}
