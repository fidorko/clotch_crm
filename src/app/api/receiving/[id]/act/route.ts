import { formatDateUa } from "@/lib/date-ua";
import { getReceivingDocument } from "@/server/data/receiving";
import { listReceivingDocumentItems } from "@/server/data/receiving-items";
import { getSupplierById } from "@/server/data/suppliers";
import { getWarehouseById } from "@/server/data/warehouses";
import { buildReceivingActPdf } from "@/server/warehouse/receiving-act-pdf";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// Акт формується лише після завершення документа (completedAt) — та сама
// умова, що вмикає плитку в ReceivingQuickActions (warehouse-receiving.md).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = getDevTenantId();

  const document = await getReceivingDocument(tenantId, id);
  if (!document) {
    return new Response("Документ не знайдено", { status: 404 });
  }
  if (!document.completedAt) {
    return new Response("Акт можна сформувати лише після завершення документа", { status: 400 });
  }

  const [items, supplier, warehouse] = await Promise.all([
    listReceivingDocumentItems(tenantId, id),
    document.supplierId ? getSupplierById(tenantId, document.supplierId) : null,
    document.warehouseId ? getWarehouseById(tenantId, document.warehouseId) : null,
  ]);

  const pdfBytes = await buildReceivingActPdf({
    documentNumber: document.number,
    isPlanned: document.isPlanned,
    supplierName: supplier?.supplier.name ?? null,
    warehouseName: warehouse?.name ?? null,
    responsiblePerson: document.responsiblePerson,
    completedAtLabel: formatDateUa(document.completedAt) ?? "",
    items: items.map((item) => ({
      productName: item.productName,
      color: item.color,
      size: item.size,
      ordered: item.ordered,
      received: item.received,
    })),
  });

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="act-${document.number}.pdf"`,
    },
  });
}
