import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/detail-row";
import type { Product } from "@/lib/types/product";

export function ProductMetaPanel({ product }: { product: Product }) {
  const { meta } = product;
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <DetailRow label="Створено" value={meta.createdAt} />
        <DetailRow label="Оновлено" value={meta.updatedAt} />
        <DetailRow label="Створив" value={meta.createdBy} />
        <DetailRow label="Постачальник" value={meta.supplier} />
        <DetailRow label="Країна бренду" value={meta.brandCountry} />
        <DetailRow label="Штрихкод моделі" value={meta.modelBarcode} />
        <DetailRow label="Вага моделі" value={`${meta.modelWeightKg} кг`} />
        <DetailRow label="Об'єм" value={`${meta.volumeM3} м³`} />
        <DetailRow label="Статус" value={<Badge variant="success">Активний</Badge>} />

        <div className="py-2">
          <p className="mb-2 text-sm text-muted-foreground">Теги</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {product.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="gap-1 pr-1.5">
                {tag.label}
                <button
                  type="button"
                  aria-label={`Прибрати тег ${tag.label}`}
                  className="rounded-full hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Button variant="link" className="h-auto px-0 py-1.5 text-sm">
            <Plus className="size-3.5" />
            Додати тег
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
