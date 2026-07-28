"use client";

import { useState } from "react";
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

export function ProductPhotoGallery({ photos }: { photos: ProductPhoto[] }) {
  const [activeId, setActiveId] = useState(photos[0]?.id);
  const active = photos.find((p) => p.id === activeId) ?? photos[0];

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Фото моделі</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-4 gap-3">
          <PhotoPlaceholder className="col-span-2 row-span-3 aspect-[3/4]" />
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
              <PhotoPlaceholder className="size-full" />
            </button>
          ))}
          <button
            type="button"
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-5" />
            <span className="text-xs">Додати фото</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
