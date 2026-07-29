import { Pencil, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductSku } from "@/lib/types/product";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function groupByColor(skus: ProductSku[]) {
  const colors = new Map<string, { hex: string; bySize: Map<string, ProductSku> }>();
  for (const sku of skus) {
    if (!colors.has(sku.color)) {
      colors.set(sku.color, { hex: sku.colorHex, bySize: new Map() });
    }
    colors.get(sku.color)!.bySize.set(sku.size, sku);
  }
  return colors;
}

export function ProductSkuTable({
  skus,
  selectedSkuId,
  onSelect,
}: {
  skus: ProductSku[];
  selectedSkuId?: string;
  onSelect?: (skuId: string) => void;
}) {
  const colorRows = groupByColor(skus);

  return (
    <Card className="h-full gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-sm font-medium">Варіанти (SKU)</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Додати колір
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Додати розмір
          </Button>
          <Button variant="outline" size="sm">
            Автогенерація SKU
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Колір \ Розмір</TableHead>
                {SIZE_ORDER.map((size) => (
                  <TableHead key={size} className="text-center">
                    {size}
                  </TableHead>
                ))}
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...colorRows.entries()].map(([color, { hex, bySize }]) => (
                <TableRow key={color} className="hover:bg-transparent">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: hex }}
                      />
                      {color}
                    </div>
                  </TableCell>
                  {SIZE_ORDER.map((size) => {
                    const sku = bySize.get(size);
                    if (!sku) {
                      return <TableCell key={size} className="text-center text-muted-foreground">—</TableCell>;
                    }
                    return (
                      <TableCell key={size} className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => onSelect?.(sku.id)}
                          className={
                            "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent " +
                            (sku.id === selectedSkuId ? "bg-accent" : "")
                          }
                        >
                          <div className="font-medium text-foreground">{sku.code}</div>
                          <div className="text-muted-foreground">ШК: {sku.barcode}</div>
                          <div className="text-muted-foreground">
                            Зал: <span className={sku.stock === 0 ? "text-destructive" : ""}>{sku.stock}</span>
                          </div>
                        </button>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Редагувати">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Видалити">
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="link" className="mt-1 h-auto px-0 py-1.5 text-sm">
          <Plus className="size-3.5" />
          Додати колір
        </Button>
      </CardContent>
    </Card>
  );
}
