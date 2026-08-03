const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 МБ, як підписано в UI
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function validateImageFile(file: File): Promise<{ data: Buffer; mimeType: string }> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Файл завеликий (максимум 5 МБ)");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Непідтримуваний тип файлу (лише JPEG, PNG, WEBP)");
  }
  const data = Buffer.from(await file.arrayBuffer());
  return { data, mimeType: file.type };
}
