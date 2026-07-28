import { Layers, PackageCheck, PackageX, Boxes, Wallet, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import type { Product } from "@/lib/types/product";

function formatUah(value: number) {
  return `${value.toLocaleString("uk-UA")} грн`;
}

export function ProductStatsBar({ stats }: { stats: Product["stats"] }) {
  return (
    <Card className="flex-row flex-wrap gap-0 divide-x divide-border overflow-hidden py-0">
      <StatTile icon={Layers} value={String(stats.skuCount)} label="SKU" />
      <StatTile icon={PackageCheck} value={String(stats.inStockCount)} label="У наявності" />
      <StatTile
        icon={PackageX}
        value={String(stats.outOfStockCount)}
        label="Немає в наявності"
        tone="warning"
      />
      <StatTile icon={Boxes} value={String(stats.totalStock)} label="Загальний залишок" />
      <StatTile icon={Wallet} value={formatUah(stats.stockSumPurchase)} label="Сума залишків (закуп.)" />
      <StatTile icon={Landmark} value={formatUah(stats.stockSumRetail)} label="Сума залишків (роздріб)" />
    </Card>
  );
}
