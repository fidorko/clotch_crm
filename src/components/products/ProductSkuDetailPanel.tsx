"use client";

import { useState } from "react";
import { ArrowRightLeft, History, Pencil, Printer, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DetailRow } from "@/components/ui/detail-row";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SkuMeasurementsDialog } from "@/components/products/SkuMeasurementsDialog";
import type { ProductMeasurement } from "@/lib/types/product";
import type { SkuPricing } from "@/components/products/ProductSkuSection";

interface SkuDetail {
  code: string;
  inStock: boolean;
  barcode: string;
  reserve: number;
  available: number;
  cells: { code: string; qty: number }[];
  batch: string;
}

function EditablePriceRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  const [override, setOverride] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const displayed = override ?? value;

  if (isEditing) {
    return (
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            autoFocus
            value={displayed}
            onChange={(e) => setOverride(Number(e.target.value))}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="h-7 w-20 px-1.5 text-right text-sm"
          />
          <span className="text-sm text-muted-foreground">грн</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-sm text-foreground", emphasis && "font-semibold")}>
          {displayed.toFixed(2)} грн
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          aria-label={`Редагувати: ${label}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function BarcodeDetailRow({ value }: { value: string }) {
  const [barcode, setBarcode] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  function generate() {
    const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
    setBarcode(`482${digits}`);
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-muted-foreground">Штрихкод (EAN)
              <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Згенерувати штрихкод"
            onClick={generate}
          >
            <RefreshCw className="size-3.5" />
          </Button>
      </span>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="h-7 w-32 px-1.5 text-right text-sm"
          />
          
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-sm text-foreground">{barcode}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Редагувати штрихкод"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProductSkuDetailPanel({
  sku,
  measurements,
  pricing,
}: {
  sku?: SkuDetail;
  measurements: ProductMeasurement[];
  pricing: SkuPricing;
}) {
  const [codeOverride, setCodeOverride] = useState<string | null>(null);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const displayedCode = codeOverride ?? sku?.code ?? "";

  if (!sku) {
    return (
      <Card className="h-full gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-sm font-medium">Деталі SKU</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <p className="text-sm text-muted-foreground">
            Оберіть SKU в таблиці або додайте новий, натиснувши «+» на перетині кольору й розміру.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        {isEditingCode ? (
          <Input
            autoFocus
            value={displayedCode}
            onChange={(e) => setCodeOverride(e.target.value)}
            onBlur={() => setIsEditingCode(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditingCode(false);
            }}
            className="h-7 w-40 text-sm font-medium"
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">SKU: {displayedCode}</CardTitle>
            <button
              type="button"
              onClick={() => setIsEditingCode(true)}
              aria-label="Редагувати SKU"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
        <Badge variant="success">В наявності</Badge>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <div className="flex flex-col divide-y divide-border">
            <BarcodeDetailRow value={sku.barcode} />
            <EditablePriceRow label="Закупівельна ціна" value={pricing.purchasePrice} />
            <EditablePriceRow label="Моя роздрібна ціна" value={pricing.retail} emphasis />
            <EditablePriceRow label="Ціна зі знижкою(роздріб)" value={pricing.retailDiscount} />
            <EditablePriceRow label="Перечеркнута ціна" value={pricing.oldPrice} />
            <EditablePriceRow label="Моя оптова ціна" value={pricing.wholesale} />
            <EditablePriceRow label="Моя ціна дропшипперам" value={pricing.dropship} />
            
          </div>

          <div className="flex flex-col divide-y divide-border">
            <DetailRow label="Залишок" value={sku.reserve + sku.available} />
            <DetailRow label="Резерв" value={sku.reserve} />
            <DetailRow
              label="Доступно"
              value={<span className="font-semibold text-primary">{sku.available}</span>}
            />
            <DetailRow label="Партія" value={sku.batch} />
            <DetailRow
              label="Комірки"
              value={
                <div className="flex flex-col items-end gap-0.5">
                  {sku.cells.map((cell) => (
                    <span key={cell.code}>
                      {cell.code} ({cell.qty} шт)
                    </span>
                  ))}
                </div>
              }
            />
            
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">
            <History className="size-3.5" />
            Історія руху
          </Button>
          <Button variant="outline">
            <ArrowRightLeft className="size-3.5" />
            Перемістити
          </Button>
          <SkuMeasurementsDialog measurements={measurements} />
          <Button variant="outline">
            <Printer className="size-3.5" />
            Друк одного SKU
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
