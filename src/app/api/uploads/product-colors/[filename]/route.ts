import { extensionToContentType, readProductImage } from "@/server/storage/product-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// Той самий принцип, що й api/uploads/categories/[filename]: filename опаковий,
// tenantId — з сервера, не з URL (розділ 6 CLAUDE.md).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const tenantId = getDevTenantId();

  const data = await readProductImage(tenantId, "product-colors", filename);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": extensionToContentType(filename),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
