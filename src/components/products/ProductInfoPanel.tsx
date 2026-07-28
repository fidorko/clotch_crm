import { Card, CardContent } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import type { Product } from "@/lib/types/product";

const careIcons = ["👕", "🧼", "♨️", "🧺", "🚫"];

export function ProductInfoPanel({ product }: { product: Product }) {
  const { info } = product;
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <DetailRow label="Категорія" value={info.category} />
        <DetailRow label="Підкатегорія" value={info.subcategory} />
        <DetailRow label="Стать" value={info.gender} />
        <DetailRow label="Сезон" value={info.seasonType} />
        <DetailRow label="Посадка" value={info.fit} />
        <DetailRow label="Країна виробник" value={info.countryOfOrigin} />
        <DetailRow label="Виробник" value={info.manufacturer} />
        <DetailRow label="Матеріал" value={info.material} />
        <DetailRow label="Щільність" value={info.density} />
        <DetailRow label="Тип тканини" value={info.fabricType} />
        <DetailRow
          label="Інструкція по догляду"
          value={<span className="text-base">{careIcons.join(" ")}</span>}
        />
        <div className="py-2">
          <p className="mb-1 text-sm text-muted-foreground">Опис</p>
          <p className="text-sm text-foreground">{info.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
