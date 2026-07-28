import { ChevronRight, Star, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";
import type { Product } from "@/lib/types/product";

export function ProductHeader({ product }: { product: Product }) {
  const status = PRODUCT_STATUS_OPTIONS.find((option) => option.value === product.status);

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {product.breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" />}
            <span
              className={
                i === product.breadcrumb.length - 1 ? "text-foreground" : ""
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            {product.name}
          </h1>
          {status && <Badge variant={status.badgeVariant}>{status.label}</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Додати в обране">
            <Star className="size-4" />
          </Button>
          <Button variant="outline">Дублювати</Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: "outline" })}
            >
              Дії
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Архівувати</DropdownMenuItem>
              <DropdownMenuItem>Експортувати</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Видалити</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>Редагувати</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Артикул моделі:{" "}
          <span className="font-medium text-foreground">{product.modelCode}</span>
        </span>
        <span className="text-muted-foreground">
          Бренд: <span className="font-medium text-foreground">{product.brand}</span>
        </span>
        <span className="text-muted-foreground">
          Колекція:{" "}
          <span className="font-medium text-foreground">{product.collection}</span>
        </span>
        <span className="text-muted-foreground">
          Сезон: <span className="font-medium text-foreground">{product.season}</span>
        </span>
      </div>
    </div>
  );
}
