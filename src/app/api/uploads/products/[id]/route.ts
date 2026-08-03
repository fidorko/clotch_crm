import { readProductPhoto } from "@/server/data/product-photos";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// Той самий принцип, що й api/uploads/categories/[id]: id опаковий, tenantId —
// з сервера, не з URL (розділ 6 CLAUDE.md).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = getDevTenantId();

  const photo = await readProductPhoto(tenantId, id);
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
