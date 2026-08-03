import { resolveCellsForPrint } from "@/server/data/warehouse-bin-locations";
import { buildBinLabelsPdf } from "@/server/warehouse/bin-label-pdf";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import type { BinPrintSelection } from "@/lib/types/warehouse-bin";

// tenantId — лише з getDevTenantId() (сервер), warehouseId — з params (URL),
// обидва йдуть у фільтр resolveCellsForPrint: тіло запиту дає лише ids
// вибраних рядків (WarehouseBinExplorer), сам tenant/warehouse клієнт
// підмінити не може (розділ 6 CLAUDE.md).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: warehouseId } = await params;
  const tenantId = getDevTenantId();
  const selection = (await request.json()) as Partial<BinPrintSelection>;

  const cells = await resolveCellsForPrint(tenantId, warehouseId, {
    streetIds: selection.streetIds ?? [],
    rackIds: selection.rackIds ?? [],
    cellIds: selection.cellIds ?? [],
  });

  if (cells.length === 0) {
    return new Response("Немає комірок для друку", { status: 400 });
  }

  const pdfBytes = await buildBinLabelsPdf(cells);
  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="bin-labels.pdf"',
    },
  });
}
