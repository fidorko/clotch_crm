"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, ChevronDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";
import type { Product, ProductStatus } from "@/lib/types/product";
import type { CategoryRow } from "@/server/data/categories";
import { getCategoryPath } from "@/lib/categories/tree";
import { updateProductName } from "@/app/products/[id]/actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";

export function ProductHeader({
  product,
  categories,
}: {
  product: Product;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const { form, setField, isDraft, isSaving, error: saveError, save } = useProductEditor();
  const name = form.name;
  const status = form.status;
  const [nameDraft, setNameDraft] = useState(product.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, startSavingName] = useTransition();

  // Ім'я/статус живуть у спільній формі (ProductEditorContext) — саме її зберігає
  // кнопка «Створити товар»/«Редагувати». Для вже наявного товару назва додатково
  // зберігається одразу по blur/Enter (як і раніше) — не чекаючи натискання кнопки.
  function commitName() {
    const trimmed = nameDraft.trim();
    setIsEditingName(false);
    if (!trimmed || trimmed === name) {
      setNameDraft(name);
      return;
    }
    setNameError(null);
    setField("name", trimmed);
    if (isDraft) return;
    startSavingName(async () => {
      try {
        await updateProductName(product.id, trimmed);
        router.refresh();
      } catch {
        setNameError("Не вдалося зберегти назву");
        setField("name", name);
        setNameDraft(name);
      }
    });
  }

  const current =
    PRODUCT_STATUS_OPTIONS.find((option) => option.value === status) ?? PRODUCT_STATUS_OPTIONS[0];
  // Хлібні крихти йдуть за реальною категорією (повна ієрархія), не за текстовим
  // product.category — той не оновлюється автоматично при виборі categoryId (db.md).
  const categoryCrumbs = product.categoryId
    ? getCategoryPath(categories, product.categoryId).map((c) => c.name)
    : [product.category];
  const breadcrumb = ["Товари", ...categoryCrumbs, name];

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5" />}
            <span className={i === breadcrumb.length - 1 ? "text-foreground" : ""}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isEditingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameDraft(name);
                  setIsEditingName(false);
                }
              }}
              className="h-9 max-w-md text-2xl font-semibold"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name);
                  setIsEditingName(true);
                }}
                aria-label="Редагувати назву товару"
                disabled={isSavingName}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )}
          {nameError && <span className="text-xs text-destructive">{nameError}</span>}
          <Select value={status} onValueChange={(v) => setField("status", v as ProductStatus)}>
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

        <div className="flex flex-col items-end gap-1">
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
            <Button onClick={save} disabled={isSaving}>
              {isDraft ? "Створити товар" : "Редагувати"}
            </Button>
          </div>
          {saveError && <span className="text-xs text-destructive">{saveError}</span>}
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
