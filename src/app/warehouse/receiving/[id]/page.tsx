import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlannedReceivingWorkspace } from "@/components/warehouse/receiving/PlannedReceivingWorkspace";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { formatDateUa } from "@/lib/date-ua";
import { listWarehouses } from "@/server/data/warehouses";
import { listSuppliers } from "@/server/data/suppliers";
import { listProductSkusCatalog } from "@/server/data/product-skus";
import { getReceivingDocument, listReceivingCustomFields } from "@/server/data/receiving";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export const metadata: Metadata = { title: "Надходження товару" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReceivingDocumentPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = getDevTenantId();

  const document = await getReceivingDocument(tenantId, id);
  if (!document) notFound();

  // Позиції (SKU/кількості) ще не персистуються (warehouse-receiving.md) —
  // відкриття наявного документа поки підтримане лише для планового
  // (єдиний тип, що реально зберігається зараз).
  if (document.type !== "planned") notFound();

  const [warehouses, suppliers, skuCatalog, customFields] = await Promise.all([
    listWarehouses(tenantId),
    listSuppliers(tenantId),
    listProductSkusCatalog(tenantId),
    listReceivingCustomFields(tenantId, id),
  ]);

  return (
    <PlannedReceivingWorkspace
      warehouses={warehouses}
      suppliers={suppliers}
      skuCatalog={skuCatalog}
      dev={DEV_BLOCK_LABELS.warehouse}
      initialDocumentId={document.id}
      initialCustomFields={customFields}
      initialValues={{
        supplierId: document.supplierId,
        document: document.supplierDocument ?? "",
        date: formatDateUa(document.plannedDate) ?? "",
        warehouseId: document.warehouseId ?? "",
        responsible: document.responsiblePerson ?? "",
        comment: document.comment ?? "",
        ttnCarrier: document.ttnCarrier,
        ttnNumber: document.ttnNumber ?? "",
      }}
    />
  );
}
