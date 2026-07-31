import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

// Той самий патерн, що category-images.ts: поза webroot, роздача лише через
// api/uploads/fabric-types/[filename] route handler (tenantId — з сесії).
const UPLOADS_ROOT = path.join(process.cwd(), "storage", "uploads");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 МБ
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SAFE_FILENAME_RE = /^[a-zA-Z0-9_-]+\.(jpg|png|webp)$/;

function tenantFabricTypesDir(tenantId: string): string {
  return path.join(UPLOADS_ROOT, tenantId, "fabric-types");
}

export async function saveFabricTypeImage(
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

  const dir = tenantFabricTypesDir(tenantId);
  await mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return { filename, url: `/api/uploads/fabric-types/${filename}` };
}

export async function readFabricTypeImage(
  tenantId: string,
  filename: string
): Promise<Buffer | null> {
  if (!SAFE_FILENAME_RE.test(filename)) return null;
  try {
    return await readFile(path.join(tenantFabricTypesDir(tenantId), filename));
  } catch {
    return null;
  }
}

export async function deleteFabricTypeImageByUrl(tenantId: string, imageUrl: string): Promise<void> {
  const filename = imageUrl.split("/").pop();
  if (!filename || !SAFE_FILENAME_RE.test(filename)) return;
  try {
    await unlink(path.join(tenantFabricTypesDir(tenantId), filename));
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
