"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { ProductSkuCombobox } from "@/components/products/ProductSkuCombobox";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";
import { formatOrderSum } from "@/lib/types/orders";

export interface OrderLineItem {
  productSkuId: string;
  sku: string;
  productName: string;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  unitPrice: string; // рядок з крапкою (DecimalInput, conventions.md)
}

export function orderLineItemsTotal(items: OrderLineItem[]): number {
  return items.reduce((sum, item) => sum + (Number(item.unitPrice) || 0) * item.quantity, 0);
}

/** Позиції замовлення — комбобокс реального каталогу SKU + редаговані рядки (кількість/ціна, за замовч. — роздрібна ціна товару). */
export function OrderItemsCard({
  items,
  catalog,
  onChange,
}: {
  items: OrderLineItem[];
  catalog: ProductSkuCatalogItem[];
  onChange: (items: OrderLineItem[]) => void;
}) {
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
        quantity: 1,
        unitPrice: sku.retailPrice.toFixed(2),
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
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Товари</span>

        {items.length > 0 && (
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {items.map((item) => (
              <div key={item.productSkuId} className="flex items-center gap-3 px-3 py-2">
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} — {item.color}, {item.size}
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.productSkuId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="h-8 w-16 text-right"
                />
                <div className="flex w-28 items-center gap-1">
                  <DecimalInput
                    value={item.unitPrice}
                    onChange={(v) => updateItem(item.productSkuId, { unitPrice: v })}
                    className="h-8 text-right"
                  />
                  <span className="text-xs text-muted-foreground">грн</span>
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-foreground">
                  {formatOrderSum((Number(item.unitPrice) || 0) * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.productSkuId)}
                  aria-label={`Прибрати ${item.productName}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <ProductSkuCombobox
          catalog={catalog}
          excludeIds={items.map((item) => item.productSkuId)}
          onAdd={addItem}
        />

        <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
          <span className="text-sm text-muted-foreground">Разом:</span>
          <span className="text-base font-semibold text-foreground">{formatOrderSum(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
