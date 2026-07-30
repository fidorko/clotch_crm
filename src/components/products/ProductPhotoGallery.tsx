"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { cn } from "@/lib/utils";
import { deleteProductPhotoAction, uploadProductPhotoAction } from "@/app/products/[id]/actions";
import type { ProductPhoto } from "@/lib/types/product";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-muted text-muted-foreground/50",
        className
      )}
    >
      <ImageIcon className="size-6" />
    </div>
  );
}

function PhotoImage({ photo, className }: { photo?: ProductPhoto; className?: string }) {
  if (!photo?.url) return <PhotoPlaceholder className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- зберігається поза webroot, next/image не роздає такі шляхи
    <img
      src={photo.url}
      alt={photo.alt}
      className={cn("size-full rounded-lg object-cover", className)}
    />
  );
}

export function ProductPhotoGallery({
  productId,
  photos: initialPhotos,
}: {
  productId: string;
  photos: ProductPhoto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeId, setActiveId] = useState<string | undefined>(initialPhotos[0]?.id);
  const active = photos.find((p) => p.id === activeId) ?? photos[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const newFiles = [...files].filter((file) => ALLOWED_TYPES.has(file.type));
    if (newFiles.length === 0) return;
    setError(null);

    startUpload(async () => {
      let firstUploadedId: string | undefined;
      for (const file of newFiles) {
        const fd = new FormData();
        fd.set("file", file);
        try {
          const photo = await uploadProductPhotoAction(productId, fd);
          setPhotos((prev) => [...prev, photo]);
          firstUploadedId ??= photo.id;
        } catch (err) {
          setError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
        }
      }
      if (firstUploadedId) setActiveId(firstUploadedId);
    });
  }

  function handleDelete(photoId: string) {
    setError(null);
    startUpload(async () => {
      try {
        await deleteProductPhotoAction(photoId, productId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setActiveId((prev) => (prev === photoId ? undefined : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити фото");
      }
    });
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Фото моделі</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="relative col-span-2 row-span-3">
            <PhotoImage photo={active} className="aspect-[3/4] size-full" />
            {active?.url && (
              <ConfirmDeleteIconButton
                ariaLabel="Видалити фото"
                title="Видалити фото?"
                description="Фото буде видалено. Цю дію не можна скасувати."
                onConfirm={() => handleDelete(active.id)}
                className="absolute top-1.5 right-1.5 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur-sm hover:text-destructive"
              />
            )}
          </div>
          {photos.slice(1).map((photo) => (
            <div key={photo.id} className="group relative aspect-square">
              <button
                type="button"
                onClick={() => setActiveId(photo.id)}
                className={cn(
                  "size-full rounded-lg outline-offset-2",
                  photo.id === active?.id && "outline-2 outline-ring"
                )}
                aria-label={photo.alt}
              >
                <PhotoImage photo={photo} />
              </button>
              <ConfirmDeleteIconButton
                ariaLabel="Видалити фото"
                title="Видалити фото?"
                description="Фото буде видалено. Цю дію не можна скасувати."
                onConfirm={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 rounded-md bg-background/80 p-0.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-destructive"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            <span className="text-xs">{isUploading ? "Завантаження..." : "Додати фото"}</span>
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
