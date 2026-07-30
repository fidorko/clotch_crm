import { extensionToContentType, readCategoryImage } from "@/server/storage/category-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// tenantId тут — з getDevTenantId() (сервер), НЕ з URL: filename опаковий,
// без tenant_id усередині. Чужий tenantId просто не знайде файл на диску
// в своїй теці — 404, а не витік чужого зображення (розділ 6 CLAUDE.md).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const tenantId = getDevTenantId();

  const data = await readCategoryImage(tenantId, filename);
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
