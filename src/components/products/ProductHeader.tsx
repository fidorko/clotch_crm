"use client";

import { useState } from "react";
import { ChevronRight, Star, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";
import type { Product, ProductStatus } from "@/lib/types/product";

export function ProductHeader({ product }: { product: Product }) {
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const current =
    PRODUCT_STATUS_OPTIONS.find((option) => option.value === status) ?? PRODUCT_STATUS_OPTIONS[0];

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
          <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
            <SelectTrigger className="w-fit gap-1 border-transparent bg-transparent px-1.5 py-1 shadow-none hover:border-input hover:bg-accent/50 data-[state=open]:border-input">
              <Badge variant={current.badgeVariant}>{current.label}</Badge>
            </SelectTrigger>
            <SelectContent align="start">
              {PRODUCT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <Badge variant={option.badgeVariant}>{option.label}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
