import type { Metadata } from "next";
import { ReceivingFormHeader } from "@/components/warehouse/receiving/ReceivingFormHeader";
import { ReceivingItemsTable } from "@/components/warehouse/receiving/ReceivingItemsTable";
import { ReceivingInfoForm } from "@/components/warehouse/receiving/ReceivingInfoForm";
import { ReceivingSummary } from "@/components/warehouse/receiving/ReceivingSummary";
import { ReceivingQuickActions } from "@/components/warehouse/receiving/ReceivingQuickActions";
import { ReceivingActivityRow } from "@/components/warehouse/receiving/ReceivingActivityRow";
import { PlannedReceivingWorkspace } from "@/components/warehouse/receiving/PlannedReceivingWorkspace";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { listWarehouses } from "@/server/data/warehouses";
import { listSuppliers } from "@/server/data/suppliers";
import { listProductSkusCatalog } from "@/server/data/product-skus";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { MOCK_RECEIVING_ITEMS } from "@/lib/mocks/receiving";

export const metadata: Metadata = { title: "Надходження товару" };

type PageProps = {
  searchParams: Promise<{ warehouseId?: string; type?: string }>;
};

export default async function ReceivingFormPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const isPlanned = sp.type === "planned";
  const tenantId = getDevTenantId();
  const [warehouses, suppliers, skuCatalog] = await Promise.all([
    listWarehouses(tenantId),
    listSuppliers(tenantId),
    listProductSkusCatalog(tenantId),
  ]);
  const dev = DEV_BLOCK_LABELS.warehouse;

  if (isPlanned) {
    return (
      <PlannedReceivingWorkspace
        documentType="planned"
        warehouses={warehouses}
        suppliers={suppliers}
        skuCatalog={skuCatalog}
        defaultWarehouseId={sp.warehouseId}
        dev={dev}
      />
    );
  }

  const positions = MOCK_RECEIVING_ITEMS.length;
  const expected = MOCK_RECEIVING_ITEMS.reduce((sum, item) => sum + item.ordered, 0);
  const received = MOCK_RECEIVING_ITEMS.reduce((sum, item) => sum + item.received, 0);
  const discrepancies = MOCK_RECEIVING_ITEMS.filter((item) => item.received !== item.ordered).length;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="ReceivingFormHeader" enabled={dev}>
        <ReceivingFormHeader />
      </DevBlockLabel>

      <DevBlockLabel name="ReceivingFormPage" enabled={dev}>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_360px]">
            <ReceivingItemsTable />

            <div className="flex flex-col gap-4">
              <ReceivingInfoForm
                warehouses={warehouses}
                suppliers={suppliers}
                defaultWarehouseId={sp.warehouseId}
              />
              <ReceivingSummary
                stats={[
                  { label: "Позицій", value: positions },
                  { label: "Очікується", value: expected },
                  { label: "Прийнято", value: received },
                  { label: "Розбіжностей", value: discrepancies, tone: "destructive" },
                ]}
              />
              <ReceivingQuickActions type="actual" />
            </div>
          </div>

          <ReceivingActivityRow />
        </div>
      </DevBlockLabel>
    </div>
  );
}
