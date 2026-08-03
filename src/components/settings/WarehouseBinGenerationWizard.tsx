"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BinGeneratorParams } from "@/lib/warehouse/bin-address";
import type { WarehouseBinGenerationPreview } from "@/lib/types/warehouse-bin";
import {
  generateBinLocationsAction,
  previewBinGenerationAction,
} from "@/app/settings/warehouses/bin-locations-actions";

function pluralizeCells(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "комірка";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "комірки";
  return "комірок";
}

/**
 * Підтвердження перед реальною генерацією — за прямою вказівкою людини
 * (2026-08-03): захист від випадкового створення тисяч комірок помилково
 * введеним числом. Показує сухий прогін (previewBinGenerationAction) перед
 * тим, як дозволити підтвердити; генерація завжди пропускає наявні коди
 * (onConflictDoNothing), тож "лише нові" — не перемикач, а гарантія.
 */
export function WarehouseBinGenerationWizard({
  open,
  onOpenChange,
  warehouseId,
  params,
  generateBarcodes,
  generateQr,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  params: BinGeneratorParams;
  generateBarcodes: boolean;
  generateQr: boolean;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<WarehouseBinGenerationPreview | null>(null);
  const [wantsPdf, setWantsPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);

  // Скидання попереднього результату на відкриття/закриття — під час рендеру
  // (не в ефекті, react-hooks/set-state-in-effect), той самий принцип, що
  // DecimalInput/Sidebar (adjusting state when a prop changes).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPreview(null);
      setResultCount(null);
      setError(null);
    }
  }

  // isLoadingPreview — похідне, не власний стан: "рендер-час" скидання вище
  // вже гарантує preview===null щойно open стає true, до того, як цей ефект
  // встигне відпрацювати.
  const isLoadingPreview = open && preview === null && error === null;

  useEffect(() => {
    if (!open) return;
    previewBinGenerationAction(warehouseId, params)
      .then(setPreview)
      .catch((err) => setError(err instanceof Error ? err.message : "Не вдалося порахувати комірки"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- відкриття діалогу — єдиний тригер прогону, params стабільні на момент відкриття
  }, [open, warehouseId]);

  async function handleConfirm() {
    setIsGenerating(true);
    setError(null);
    try {
      const inserted = await generateBinLocationsAction(warehouseId, params, {
        generateBarcodes,
        generateQr,
      });
      setResultCount(inserted);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося згенерувати комірки");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Підтвердження генерації структури</DialogTitle>
          <DialogDescription>
            Перевірте кількість перед створенням — дію не можна скасувати одним кліком.
          </DialogDescription>
        </DialogHeader>

        {resultCount !== null ? (
          <Alert>
            <AlertDescription>
              Створено {resultCount} {pluralizeCells(resultCount)}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-3">
            {isLoadingPreview ? (
              <p className="text-sm text-muted-foreground">Рахуємо...</p>
            ) : preview ? (
              <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Запитано за параметрами</span>
                  <span className="font-medium text-foreground">
                    {preview.totalRequested} {pluralizeCells(preview.totalRequested)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Уже існує в складі</span>
                  <span className="font-medium text-foreground">{preview.existingTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Збігається з наявними (буде пропущено)</span>
                  <span className="font-medium text-foreground">{preview.alreadyMatching}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-foreground">Реально буде створено</span>
                  <span className="font-semibold text-primary">
                    {preview.willCreateNew} {pluralizeCells(preview.willCreateNew)}
                  </span>
                </div>
              </div>
            ) : null}

            <label className="flex items-start gap-2 text-sm text-foreground">
              <Checkbox checked={wantsPdf} onCheckedChange={(v) => setWantsPdf(v === true)} />
              <span>
                Сформувати PDF для друку етикеток одразу
                <span className="block text-xs text-muted-foreground">
                  (поки не реалізовано — лише позначення наміру)
                </span>
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {resultCount !== null ? (
            <DialogClose render={<Button type="button" />}>Готово</DialogClose>
          ) : (
            <>
              <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isGenerating || isLoadingPreview || !preview || preview.willCreateNew === 0}
              >
                Згенерувати
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
