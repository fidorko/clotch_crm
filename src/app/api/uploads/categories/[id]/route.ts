import { readCategoryImage } from "@/server/data/category-images";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

// tenantId тут — з getDevTenantId() (сервер), НЕ з URL: id опаковий (рядок
// category_images), route сам бере tenantId і шукає рядок саме цього тенанта.
// Чужий tenantId просто не знайде рядок — 404, а не витік чужого зображення
// (розділ 6 CLAUDE.md).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = getDevTenantId();

  const image = await readCategoryImage(tenantId, id);
  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
