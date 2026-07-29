"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductPhoto } from "@/lib/types/product";

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
    // eslint-disable-next-line @next/next/no-img-element -- локальний прев'ю (blob:), next/image не вміє в такі урли
    <img
      src={photo.url}
      alt={photo.alt}
      className={cn("size-full rounded-lg object-cover", className)}
    />
  );
}

export function ProductPhotoGallery({ photos: initialPhotos }: { photos: ProductPhoto[] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeId, setActiveId] = useState(initialPhotos[0]?.id);
  const active = photos.find((p) => p.id === activeId) ?? photos[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- має бачити фінальний список на unmount, не знімок з моменту монтування
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    const newFiles = [...files].filter((file) => file.type.startsWith("image/"));
    if (newFiles.length === 0) return;

    let firstFilledId: string | undefined;

    setPhotos((prev) => {
      const next = [...prev];
      let fileIndex = 0;

      // Спершу заповнюємо порожні слоти-заглушки по порядку, а не додаємо в кінець.
      for (let i = 0; i < next.length && fileIndex < newFiles.length; i++) {
        if (next[i].url) continue;
        const url = URL.createObjectURL(newFiles[fileIndex]);
        objectUrls.current.push(url);
        next[i] = { ...next[i], url };
        firstFilledId ??= next[i].id;
        fileIndex++;
      }

      while (fileIndex < newFiles.length) {
        const file = newFiles[fileIndex];
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        const photo: ProductPhoto = { id: `local-${crypto.randomUUID()}`, url, alt: file.name };
        next.push(photo);
        firstFilledId ??= photo.id;
        fileIndex++;
      }

      return next;
    });

    if (firstFilledId) setActiveId(firstFilledId);
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Фото моделі</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-4 gap-3">
          <PhotoImage photo={active} className="col-span-2 row-span-3 aspect-[3/4]" />
          {photos.slice(1).map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveId(photo.id)}
              className={cn(
                "aspect-square rounded-lg outline-offset-2",
                photo.id === active?.id && "outline-2 outline-ring"
              )}
              aria-label={photo.alt}
            >
              <PhotoImage photo={photo} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-5" />
            <span className="text-xs">Додати фото</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
