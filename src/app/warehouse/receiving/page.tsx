import type { Metadata } from "next";
import { ReceivingHeader } from "@/components/warehouse/receiving/ReceivingHeader";
import { ReceivingKpiCards } from "@/components/warehouse/receiving/ReceivingKpiCards";
import { ReceivingDocumentsTable } from "@/components/warehouse/receiving/ReceivingDocumentsTable";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { listReceivingDocuments } from "@/server/data/receiving";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Надходження" };

type PageProps = {
  searchParams: Promise<{ warehouseId?: string }>;
};

export default async function ReceivingListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const dev = DEV_BLOCK_LABELS.warehouse;
  const documents = await listReceivingDocuments(getDevTenantId());

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="ReceivingHeader" enabled={dev}>
        <ReceivingHeader warehouseId={sp.warehouseId} />
      </DevBlockLabel>

      <DevBlockLabel name="ReceivingListPage" enabled={dev}>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <ReceivingKpiCards documents={documents} />
          <ReceivingDocumentsTable documents={documents} />
        </div>
      </DevBlockLabel>
    </div>
  );
}
