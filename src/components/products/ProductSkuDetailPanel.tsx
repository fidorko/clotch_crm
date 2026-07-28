import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/detail-row";
import { Separator } from "@/components/ui/separator";

interface SkuDetail {
  code: string;
  inStock: boolean;
  barcode: string;
  reserve: number;
  available: number;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  promoPrice: number;
  minPrice: number;
  weightKg: number;
  volumeM3: number;
  cells: { code: string; qty: number }[];
  batch: string;
  arrivalDate: string;
  supplier: string;
}

function formatUah(value: number) {
  return `${value.toFixed(2)} грн`;
}

export function ProductSkuDetailPanel({ sku }: { sku: SkuDetail }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4">
        <CardTitle className="text-sm font-medium">SKU: {sku.code}</CardTitle>
        <Badge variant="success">В наявності</Badge>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
          <div className="flex flex-col divide-y divide-border">
            <DetailRow label="Штрихкод (EAN)" value={sku.barcode} />
            <DetailRow label="Закупівельна ціна" value={formatUah(sku.purchasePrice)} />
            <DetailRow label="Роздрібна ціна" value={formatUah(sku.retailPrice)} emphasis />
            <DetailRow label="Оптова ціна" value={formatUah(sku.wholesalePrice)} />
            <DetailRow label="Акційна ціна" value={formatUah(sku.promoPrice)} />
            <DetailRow label="Мінімальна ціна" value={formatUah(sku.minPrice)} />
            <DetailRow label="Вага SKU" value={`${sku.weightKg} кг`} />
            <DetailRow label="Об'єм SKU" value={`${sku.volumeM3} м³`} />
          </div>

          <div className="flex flex-col divide-y divide-border">
            <DetailRow label="Залишок" value={sku.reserve + sku.available} />
            <DetailRow label="Резерв" value={sku.reserve} />
            <DetailRow
              label="Доступно"
              value={<span className="font-semibold text-primary">{sku.available}</span>}
            />
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
            <DetailRow label="Партія" value={sku.batch} />
            <DetailRow label="Дата приходу" value={sku.arrivalDate} />
            <DetailRow label="Постачальник" value={sku.supplier} />
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Історія руху</Button>
          <Button variant="outline">Перемістити</Button>
          <Button className="ml-auto">Редагувати SKU</Button>
        </div>
      </CardContent>
    </Card>
  );
}
