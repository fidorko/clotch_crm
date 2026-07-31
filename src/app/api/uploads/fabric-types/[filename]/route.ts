import { extensionToContentType, readFabricTypeImage } from "@/server/storage/fabric-type-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// tenantId — з getDevTenantId() (сервер), не з URL; той самий підхід, що
// api/uploads/categories/[filename] (decisions.md).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const tenantId = getDevTenantId();

  const data = await readFabricTypeImage(tenantId, filename);
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
