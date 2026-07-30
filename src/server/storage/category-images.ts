import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Поза webroot: не в public/ (Next не роздає статично напряму) і не в src/
// (не частина бандла). Роздається лише через api/uploads/categories/[filename]
// route handler, який сам визначає tenantId з сесії — не з URL.
const UPLOADS_ROOT = path.join(process.cwd(), "storage", "uploads");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 МБ, як підписано в UI
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Лише [a-zA-Z0-9_-]+.ext — захист від path traversal у route handler.
const SAFE_FILENAME_RE = /^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/;

function tenantCategoriesDir(tenantId: string): string {
  return path.join(UPLOADS_ROOT, tenantId, "categories");
}

export async function saveCategoryImage(
  tenantId: string,
  file: File
): Promise<{ filename: string; url: string }> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Файл завеликий (максимум 5 МБ)");
  }
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new Error("Непідтримуваний тип файлу (лише JPEG, PNG, WEBP)");
  }

  const dir = tenantCategoriesDir(tenantId);
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { filename, url: `/api/uploads/categories/${filename}` };
}

export async function readCategoryImage(
  tenantId: string,
  filename: string
): Promise<Buffer | null> {
  if (!SAFE_FILENAME_RE.test(filename)) return null;
  try {
    return await readFile(path.join(tenantCategoriesDir(tenantId), filename));
  } catch {
    return null;
  }
}

export async function deleteCategoryImageByUrl(tenantId: string, imageUrl: string): Promise<void> {
  const filename = imageUrl.split("/").pop();
  if (!filename || !SAFE_FILENAME_RE.test(filename)) return;
  try {
    await unlink(path.join(tenantCategoriesDir(tenantId), filename));
  } catch {
    // Файл уже міг бути видалений — не критично.
  }
}

export function extensionToContentType(filename: string): string {
  const ext = filename.split(".").pop();
  if (ext === "jpg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}
