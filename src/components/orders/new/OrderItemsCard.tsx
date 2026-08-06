"use client";

import { useState } from "react";
import { Sparkles, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProductSkuCombobox } from "@/components/products/ProductSkuCombobox";
import { DiscountInput } from "@/components/orders/new/DiscountInput";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { OrderDiscountTypeValue } from "@/server/data/orders";
import { formatOrderSum } from "@/lib/types/orders";
import { applyDiscount } from "@/lib/orders/discount";

export interface OrderLineItem {
  productSkuId: string;
  sku: string;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  photoUrl: string | null;
  stock: number;
  quantity: number;
  unitPrice: string; // рядок з крапкою (DecimalInput, conventions.md)
  discountType: OrderDiscountTypeValue | null;
  discountValue: string;
  packageWeightKg: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
}

function lineTotal(item: OrderLineItem): number {
  const base = (Number(item.unitPrice) || 0) * item.quantity;
  return applyDiscount(base, item.discountType, item.discountValue);
}

export function orderLineItemsTotal(items: OrderLineItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

function StubButton({ label, icon: Icon }: { label: string; icon: typeof Sparkles }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="sm" disabled type="button" />}>
        <Icon className="size-4" />
        {label}
      </TooltipTrigger>
      <TooltipContent>Поки без функціоналу</TooltipContent>
    </Tooltip>
  );
}

/** Товари — комбобокс реального каталогу SKU, склад відвантаження (один на все замовлення), знижка на рядок, примітка. */
export function OrderItemsCard({
  items,
  catalog,
  warehouses,
  warehouseId,
  onWarehouseChange,
  itemsNote,
  onItemsNoteChange,
  onChange,
}: {
  items: OrderLineItem[];
  catalog: ProductSkuCatalogItem[];
  warehouses: WarehouseRow[];
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  itemsNote: string;
  onItemsNoteChange: (value: string) => void;
  onChange: (items: OrderLineItem[]) => void;
}) {
  const [showNote, setShowNote] = useState(Boolean(itemsNote));
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId) ?? null;

  function addItem(sku: ProductSkuCatalogItem) {
    onChange([
      ...items,
      {
        productSkuId: sku.id,
        sku: sku.sku,
        productName: sku.productName,
        color: sku.color,
        colorHex: sku.colorHex,
        size: sku.size,
        photoUrl: sku.photoUrl,
        stock: sku.stock,
        quantity: 1,
        unitPrice: sku.retailPrice.toFixed(2),
        discountType: null,
        discountValue: "",
        packageWeightKg: sku.packageWeightKg,
        packageLengthCm: sku.packageLengthCm,
        packageWidthCm: sku.packageWidthCm,
        packageHeightCm: sku.packageHeightCm,
      },
    ]);
  }

  function updateItem(productSkuId: string, patch: Partial<OrderLineItem>) {
    onChange(items.map((item) => (item.productSkuId === productSkuId ? { ...item, ...patch } : item)));
  }

  function removeItem(productSkuId: string) {
    onChange(items.filter((item) => item.productSkuId !== productSkuId));
  }

  const total = orderLineItemsTotal(items);

  return (
    <Card className="h-full gap-3 p-4">
      <CardContent className="flex h-full flex-col gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-semibold text-foreground">Товари</span>
          <div className="flex items-center gap-2">
            <StubButton label="Up-sell" icon={TrendingUp} />
            <StubButton label="Cross-sell" icon={Sparkles} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProductSkuCombobox catalog={catalog} excludeIds={items.map((item) => item.productSkuId)} onAdd={addItem} />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Склад відвантаження</span>
            <Select value={warehouseId} onValueChange={(v) => v && onWarehouseChange(v)}>
              <SelectTrigger size="sm" className="w-56">
                <SelectValue>{() => selectedWarehouse?.name ?? "Оберіть склад"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                    {w.isPrimary ? " (основний)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="w-8 shrink-0" />
              <span className="min-w-0 flex-1">Товар</span>
              <span className="w-20 shrink-0">Артикул</span>
              <span className="w-20 shrink-0">SKU</span>
              <span className="w-28 shrink-0">Склад</span>
              <span className="w-20 shrink-0 text-right">Залишок</span>
              <span className="w-16 shrink-0 text-right">К-сть</span>
              <span className="w-24 shrink-0 text-right">Ціна</span>
              <span className="w-32 shrink-0 text-right">Знижка</span>
              <span className="w-24 shrink-0 text-right">Сума</span>
              <span className="w-6 shrink-0" />
            </div>
            {items.map((item) => (
              <div key={item.productSkuId} className="flex items-center gap-3 px-3 py-2">
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photoUrl} alt="" className="size-8 shrink-0 rounded object-cover" />
                ) : (
                  <span
                    className="size-8 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.color}, {item.size}
                  </p>
                </div>
                <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{item.sku}</span>
                <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{item.sku}</span>
                <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                  {selectedWarehouse?.name ?? "—"}
                </span>
                <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{item.stock}</span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.productSkuId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-8 w-16 text-right"
                />
                <div className="flex w-24 items-center gap-1">
                  <DecimalInput
                    value={item.unitPrice}
                    onChange={(v) => updateItem(item.productSkuId, { unitPrice: v })}
                    className="h-8 text-right"
                  />
                </div>
                <DiscountInput
                  type={item.discountType}
                  value={item.discountValue}
                  onChange={(type, value) => updateItem(item.productSkuId, { discountType: type, discountValue: value })}
                  className="w-32 shrink-0"
                />
                <span className="w-24 shrink-0 text-right text-sm text-foreground">{formatOrderSum(lineTotal(item))}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productSkuId)}
                  aria-label={`Прибрати ${item.productName}`}
                  className="w-6 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-2">
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowNote((v) => !v)}>
              Додати примітку до товарів
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Загальна сума товарів:</span>
              <span className="text-base font-semibold text-foreground">{formatOrderSum(total)}</span>
            </div>
          </div>
          {showNote && (
            <Textarea
              value={itemsNote}
              onChange={(e) => onItemsNoteChange(e.target.value)}
              placeholder="Примітка до товарів..."
              rows={2}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
