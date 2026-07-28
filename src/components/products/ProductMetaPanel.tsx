"use client";

import { useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SelectRow } from "@/components/ui/select-row";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/constants/product-status";
import type { Product, ProductStatus } from "@/lib/types/product";

// Тимчасові довідники. Планово — довідники з БД (див. db.md).
const SUPPLIER_OPTIONS = ["Textile Group", "FabricPro", "UkrLen", "Prime Textile"];
const BRAND_COUNTRY_OPTIONS = ["Україна", "Туреччина", "Польща", "Італія", "Китай", "США"];
const TAG_OPTIONS = [
  "базова",
  "oversize",
  "бавовна",
  "лімітована серія",
  "нова колекція",
  "хіт продажів",
  "знижка",
  "органічна бавовна",
  "унісекс",
  "з принтом",
  "однотонна",
  "premium",
];

function generateBarcode() {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  return `482${digits}`;
}

function BarcodeRow({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">Штрихкод моделі</span>
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-36 px-2 text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Згенерувати штрихкод"
          onClick={() => onChange(generateBarcode())}
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PackageDimensionsRow({
  length,
  width,
  height,
  weight,
  onChangeLength,
  onChangeWidth,
  onChangeHeight,
  onChangeWeight,
}: {
  length: number;
  width: number;
  height: number;
  weight: number;
  onChangeLength: (value: number) => void;
  onChangeWidth: (value: number) => void;
  onChangeHeight: (value: number) => void;
  onChangeWeight: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-4">
        <span className="w-40 shrink-0 text-sm text-muted-foreground">Розміри (ДхШхВ), см</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={length}
            onChange={(e) => onChangeLength(Number(e.target.value))}
            className="h-7 w-14 px-1.5 text-right text-sm"
          />
          <span className="text-sm text-muted-foreground">×</span>
          <Input
            type="number"
            min={0}
            value={width}
            onChange={(e) => onChangeWidth(Number(e.target.value))}
            className="h-7 w-14 px-1.5 text-right text-sm"
          />
          <span className="text-sm text-muted-foreground">×</span>
          <Input
            type="number"
            min={0}
            value={height}
            onChange={(e) => onChangeHeight(Number(e.target.value))}
            className="h-7 w-14 px-1.5 text-right text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-40 shrink-0 text-sm text-muted-foreground">Вага, кг</span>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={weight}
          onChange={(e) => onChangeWeight(Number(e.target.value))}
          className="h-7 w-20 px-1.5 text-right text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Для створення ЕН Нова Пошта. Вказувати розміри у запакованому вигляді.
      </p>
    </div>
  );
}

function StatusSelectRow({
  value,
  onChange,
}: {
  value: ProductStatus;
  onChange: (value: ProductStatus) => void;
}) {
  const current =
    PRODUCT_STATUS_OPTIONS.find((option) => option.value === value) ?? PRODUCT_STATUS_OPTIONS[0];

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">Статус</span>
      <Select value={value} onValueChange={(v) => onChange(v as ProductStatus)}>
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
  );
}

function TagsSection({
  tags,
  onToggle,
  onRemove,
  customTag,
  onCustomTagChange,
  onAddCustomTag,
}: {
  tags: string[];
  onToggle: (tag: string) => void;
  onRemove: (tag: string) => void;
  customTag: string;
  onCustomTagChange: (value: string) => void;
  onAddCustomTag: () => void;
}) {
  return (
    <div className="py-2">
      <p className="mb-2 text-sm text-muted-foreground">Теги</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline" className="gap-1 pr-1.5">
            {tag}
            <button
              type="button"
              aria-label={`Прибрати тег ${tag}`}
              className="rounded-full hover:bg-muted"
              onClick={() => onRemove(tag)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="mt-1.5 flex items-center gap-1 text-sm text-primary hover:underline">
          <Plus className="size-3.5" />
          Додати тег
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Оберіть теги</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {TAG_OPTIONS.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={tags.includes(tag)}
                onCheckedChange={() => onToggle(tag)}
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="flex items-center gap-1.5 p-1.5">
            <Input
              value={customTag}
              onChange={(e) => onCustomTagChange(e.target.value)}
              placeholder="Свій тег"
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddCustomTag();
                }
                if (e.key !== "Escape") {
                  e.stopPropagation();
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={onAddCustomTag}>
              Додати
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ProductMetaPanel({ product }: { product: Product }) {
  const { meta } = product;

  const [supplier, setSupplier] = useState(meta.supplier);
  const [brandCountry, setBrandCountry] = useState(meta.brandCountry);
  const [barcode, setBarcode] = useState(meta.modelBarcode);
  const [packageLength, setPackageLength] = useState(meta.packageLengthCm);
  const [packageWidth, setPackageWidth] = useState(meta.packageWidthCm);
  const [packageHeight, setPackageHeight] = useState(meta.packageHeightCm);
  const [packageWeight, setPackageWeight] = useState(meta.packageWeightKg);
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [tags, setTags] = useState<string[]>(product.tags.map((tag) => tag.label));
  const [customTag, setCustomTag] = useState("");

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function addCustomTag() {
    const value = customTag.trim();
    if (!value || tags.includes(value)) return;
    setTags((prev) => [...prev, value]);
    setCustomTag("");
  }

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <DetailRow align="left" label="Створено" value={meta.createdAt} />
        <DetailRow align="left" label="Оновлено" value={meta.updatedAt} />
        <DetailRow align="left" label="Створив" value={meta.createdBy} />
        <DetailRow align="left" label="Останній редагував" value={meta.updatedBy} />
        <SelectRow
          label="Постачальник"
          value={supplier}
          options={SUPPLIER_OPTIONS}
          onChange={setSupplier}
        />
        <SelectRow
          label="Країна бренду"
          value={brandCountry}
          options={BRAND_COUNTRY_OPTIONS}
          onChange={setBrandCountry}
        />
        <BarcodeRow value={barcode} onChange={setBarcode} />
        <PackageDimensionsRow
          length={packageLength}
          width={packageWidth}
          height={packageHeight}
          weight={packageWeight}
          onChangeLength={setPackageLength}
          onChangeWidth={setPackageWidth}
          onChangeHeight={setPackageHeight}
          onChangeWeight={setPackageWeight}
        />
        <StatusSelectRow value={status} onChange={setStatus} />
        <TagsSection
          tags={tags}
          onToggle={toggleTag}
          onRemove={removeTag}
          customTag={customTag}
          onCustomTagChange={setCustomTag}
          onAddCustomTag={addCustomTag}
        />
      </CardContent>
    </Card>
  );
}
