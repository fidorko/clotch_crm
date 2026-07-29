"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
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
import { SelectRow } from "@/components/ui/select-row";
import { TextRow } from "@/components/ui/text-row";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/types/product";

// Тимчасові довідники. Планово — довідники з БД (див. db.md).
const SUPPLIER_OPTIONS = ["Textile Group", "FabricPro", "UkrLen", "Prime Textile"];
const BRAND_COUNTRY_OPTIONS = ["Україна", "Туреччина", "Польща", "Італія", "Китай", "США"];
const COUNTRY_OF_ORIGIN_OPTIONS = ["Туреччина", "Україна", "Китай", "Бангладеш", "Узбекистан"];
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
  const [countryOfOrigin, setCountryOfOrigin] = useState(product.info.countryOfOrigin);
  const [description, setDescription] = useState(product.info.description);
  const [internalCode, setInternalCode] = useState(meta.internalCode);
  const [supplierCode, setSupplierCode] = useState(meta.supplierCode);
  const [packageLength, setPackageLength] = useState(meta.packageLengthCm);
  const [packageWidth, setPackageWidth] = useState(meta.packageWidthCm);
  const [packageHeight, setPackageHeight] = useState(meta.packageHeightCm);
  const [packageWeight, setPackageWeight] = useState(meta.packageWeightKg);
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
    <Card className="h-full gap-0 py-4">
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
        <SelectRow
          label="Країна виробник"
          value={countryOfOrigin}
          options={COUNTRY_OF_ORIGIN_OPTIONS}
          onChange={setCountryOfOrigin}
        />
        <TextRow label="Внутрішній артикул" value={internalCode} onChange={setInternalCode} />
        <TextRow label="Артикул постачальника" value={supplierCode} onChange={setSupplierCode} />
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
        <TagsSection
          tags={tags}
          onToggle={toggleTag}
          onRemove={removeTag}
          customTag={customTag}
          onCustomTagChange={setCustomTag}
          onAddCustomTag={addCustomTag}
        />
        <div className="py-2">
          <label htmlFor="product-description" className="mb-1 block text-sm text-muted-foreground">
            Опис
          </label>
          <Textarea
            id="product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
}
