"use client";

import { useState } from "react";
import { ImageIcon, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SkuColor } from "@/components/products/useProductSkuMatrix";

/**
 * Галерея фото товару — тільки перегляд (аплоад — лише в таблиці варіантів,
 * ProductSkuTable, під назвою кольору; прев'ю там прибрано, 2026-08-03 —
 * єдине місце перегляду тепер тут). Джерело — стан SKU-матриці
 * (useProductSkuMatrix.colors): щойно завантажене в таблиці фото зʼявляється
 * тут одразу, без перезавантаження; видалення — теж звідси (кошик на
 * наведенні), таблиця більше самих фото не показує.
 *
 * Основне фото — одне з наявних, обране кліком на зірку: рендериться значно
 * більшим за решту (окремий блок над рядком мініатюр, не квадратна обрізка) —
 * `object-contain`, щоб зображення вміщалось у своїй реальній пропорції
 * (портрет/альбом/квадрат), без кадрування. Немає обраного (ще жоден клік) —
 * перше фото за порядком просто показується великим. Клік на будь-яке фото
 * (не на зірку/кошик) відкриває його в `Dialog`-лайтбоксі на повний розмір.
 */
export function ProductPhotoGallery({
  colors,
  onSetMainPhoto,
  onDeletePhoto,
}: {
  colors: SkuColor[];
  onSetMainPhoto: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
}) {
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const items = colors.flatMap((color) =>
    color.photos.map((photo) => ({ photo, colorName: color.name, colorHex: color.hex }))
  );
  const mainIndex = items.findIndex((item) => item.photo.isMain);
  const main = mainIndex >= 0 ? items[mainIndex] : items[0];
  const rest = items.filter((_, index) => index !== (mainIndex >= 0 ? mainIndex : 0));
  const active = lightboxId ? items.find((item) => item.photo.id === lightboxId) : undefined;

  return (
    <Card className="flex h-full flex-col gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">
          Фото товару
          {items.length > 0 && (
            <span className="ml-2 font-normal text-muted-foreground">{items.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-4">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-6" />
            <p className="text-xs">
              Фото ще немає. Додати можна в таблиці варіантів — під назвою кольору.
            </p>
          </div>
        ) : (
          <>
            <div className="group relative min-h-48 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setLightboxId(main.photo.id)}
                className="absolute inset-0 size-full"
                aria-label={`Відкрити фото на повний розмір — ${main.colorName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- байти в БД, next/image не роздає такі шляхи */}
                <img
                  src={main.photo.url}
                  alt={`${main.colorName} — фото товару`}
                  className="size-full object-contain p-2"
                />
              </button>
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSetMainPhoto(main.photo.id)}
                  aria-label={main.photo.isMain ? "Основне фото" : "Зробити основним фото"}
                  title={main.photo.isMain ? "Основне фото" : "Зробити основним фото"}
                  disabled={main.photo.isMain}
                  className={cn(
                    "rounded-md bg-background/80 p-1 backdrop-blur-sm transition-opacity",
                    main.photo.isMain
                      ? "text-primary opacity-100"
                      : "text-muted-foreground opacity-0 hover:text-primary group-hover:opacity-100"
                  )}
                >
                  <Star className={cn("size-3.5", main.photo.isMain && "fill-primary")} />
                </button>
                <ConfirmDeleteIconButton
                  ariaLabel="Видалити фото"
                  title="Видалити фото?"
                  description="Фото буде видалено. Цю дію не можна скасувати."
                  onConfirm={() => onDeletePhoto(main.photo.id)}
                  className="rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-destructive"
                />
              </div>
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 backdrop-blur-sm">
                <span
                  className="size-2 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: main.colorHex }}
                  aria-hidden
                />
                <span className="truncate text-[10px] text-muted-foreground">{main.colorName}</span>
              </div>
            </div>

            {rest.length > 0 && (
              <div className="grid shrink-0 grid-cols-6 gap-2">
                {rest.map((item) => (
                  <div key={item.photo.id} className="group relative aspect-square">
                    <button
                      type="button"
                      onClick={() => setLightboxId(item.photo.id)}
                      className="absolute inset-0 size-full"
                      aria-label={`Відкрити фото на повний розмір — ${item.colorName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- байти в БД, next/image не роздає такі шляхи */}
                      <img
                        src={item.photo.url}
                        alt={`${item.colorName} — фото товару`}
                        className="size-full rounded-md border border-border object-cover"
                      />
                    </button>
                    <div className="absolute top-1 right-1 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onSetMainPhoto(item.photo.id)}
                        aria-label="Зробити основним фото"
                        title="Зробити основним фото"
                        className="rounded-md bg-background/80 p-0.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-primary [&_svg]:size-2.5"
                      >
                        <Star className="size-2.5" />
                      </button>
                      <ConfirmDeleteIconButton
                        ariaLabel="Видалити фото"
                        title="Видалити фото?"
                        description="Фото буде видалено. Цю дію не можна скасувати."
                        onConfirm={() => onDeletePhoto(item.photo.id)}
                        className="rounded-md bg-background/80 p-0.5 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-destructive [&_svg]:size-2.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setLightboxId(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {active ? `${active.colorName} — фото товару` : "Фото товару"}
          </DialogTitle>
          {active && (
            // eslint-disable-next-line @next/next/no-img-element -- байти в БД, next/image не роздає такі шляхи
            <img
              src={active.photo.url}
              alt={`${active.colorName} — фото товару`}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
