import type { Metadata } from "next";
import { SuppliersHeader } from "@/components/settings/SuppliersHeader";
import { SuppliersList } from "@/components/settings/SuppliersList";
import { listSuppliers } from "@/server/data/suppliers";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Постачальники",
};

export default async function SuppliersPage() {
  const suppliers = await listSuppliers(getDevTenantId());
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="SuppliersHeader" enabled={dev}>
        <SuppliersHeader total={suppliers.length} />
      </DevBlockLabel>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <DevBlockLabel name="SuppliersList" enabled={dev}>
          <SuppliersList suppliers={suppliers} />
        </DevBlockLabel>
      </div>
    </div>
  );
}
