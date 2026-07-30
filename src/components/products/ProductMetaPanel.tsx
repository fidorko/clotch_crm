"use client";

import { useState } from "react";
import { ArrowRightLeft, History, Pencil, Plus, Printer, RefreshCw, X } from "lucide-react";
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
import { EditableTextRow } from "@/components/ui/editable-text-row";
import { Input } from "@/components/ui/input";
import { SelectRow } from "@/components/ui/select-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkuMeasurementsDialog } from "@/components/products/SkuMeasurementsDialog";
import { TextRow } from "@/components/ui/text-row";
import { Textarea } from "@/components/ui/textarea";
import { selectedSku } from "@/lib/mocks/products";
import type { Product } from "@/lib/types/product";
import type { SupplierRow } from "@/server/data/suppliers";
import { useProductEditor } from "@/components/products/ProductEditorContext";

// Тимчасовий довідник. Планово — довідник з БД (див. db.md).
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

function SkuCodeRow({ value }: { value: string }) {
  const [code, setCode] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">SKU</span>
      {isEditing ? (
        <Input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setIsEditing(false);
          }}
          className="h-7 flex-1 px-2 text-sm"
        />
      ) : (
        <div className="flex flex-1 items-center gap-1.5">
          <span className="text-sm text-foreground">{code}</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Редагувати SKU"
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SkuBarcodeRow({ value }: { value: string }) {
  const [barcode, setBarcode] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  function generate() {
    const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
    setBarcode(`482${digits}`);
  }

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">Штрихкод (EAN)</span>
      {isEditing ? (
        <div className="flex flex-1 items-center gap-1">
          <Input
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false);
            }}
            className="h-7 flex-1 px-2 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Згенерувати штрихкод"
            onClick={generate}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-1">
          <span className="text-sm text-foreground">{barcode}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Редагувати штрихкод"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Згенерувати штрихкод"
            onClick={generate}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Постачальник тепер обирається з реального довідника (settings → Довідники →
// Постачальники), не з хардкодженого списку — value/options тут id, не назва
// (SelectValue отримує render-функцію, як і CategoriesTab, ui-kit.md).
function SupplierSelectRow({
  value,
  suppliers,
  onChange,
}: {
  value: string;
  suppliers: SupplierRow[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">Постачальник</span>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger
          size="sm"
          className="min-w-0 flex-1 justify-between gap-1 border-transparent bg-transparent px-1.5 text-sm font-normal text-foreground shadow-none hover:border-input hover:bg-accent/50 data-[state=open]:border-input"
        >
          <SelectValue className="truncate">
            {(v: string) => suppliers.find((s) => s.id === v)?.name ?? "—"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          {suppliers.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Немає постачальників</div>
          ) : (
            suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ProductMetaPanel({
  product,
  variantsEnabled,
  suppliers,
}: {
  product: Product;
  variantsEnabled: boolean;
  suppliers: SupplierRow[];
}) {
  const { form, setField } = useProductEditor();
  const meta = form.meta;
  const info = form.info;

  const supplierId = form.supplierId;
  const brandCountry = meta.brandCountry;
  const countryOfOrigin = info.countryOfOrigin;
  const description = info.description;
  const internalCode = meta.internalCode;
  const supplierCode = meta.supplierCode;
  const packageLength = meta.packageLengthCm;
  const packageWidth = meta.packageWidthCm;
  const packageHeight = meta.packageHeightCm;
  const packageWeight = meta.packageWeightKg;
  const tags = form.tags;
  const [customTag, setCustomTag] = useState("");

  function setMeta<K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) {
    setField("meta", { ...meta, [key]: value });
  }

  function setInfo<K extends keyof typeof info>(key: K, value: (typeof info)[K]) {
    setField("info", { ...info, [key]: value });
  }

  const setSupplierId = (value: string) => setField("supplierId", value);
  const setBrandCountry = (value: string) => setMeta("brandCountry", value);
  const setCountryOfOrigin = (value: string) => setInfo("countryOfOrigin", value);
  const setDescription = (value: string) => setInfo("description", value);
  const setInternalCode = (value: string) => setMeta("internalCode", value);
  const setSupplierCode = (value: string) => setMeta("supplierCode", value);
  const setPackageLength = (value: number) => setMeta("packageLengthCm", value);
  const setPackageWidth = (value: number) => setMeta("packageWidthCm", value);
  const setPackageHeight = (value: number) => setMeta("packageHeightCm", value);
  const setPackageWeight = (value: number) => setMeta("packageWeightKg", value);

  function toggleTag(tag: string) {
    setField("tags", tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  function removeTag(tag: string) {
    setField("tags", tags.filter((t) => t !== tag));
  }

  function addCustomTag() {
    const value = customTag.trim();
    if (!value || tags.includes(value)) return;
    setField("tags", [...tags, value]);
    setCustomTag("");
  }

  return (
    <Card className="h-full gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <DetailRow align="left" label="Створено" value={product.meta.createdAt} />
        <DetailRow align="left" label="Оновлено" value={product.meta.updatedAt} />
        <DetailRow align="left" label="Створив" value={product.meta.createdBy} />
        <DetailRow align="left" label="Останній редагував" value={product.meta.updatedBy} />
        <SupplierSelectRow value={supplierId} suppliers={suppliers} onChange={setSupplierId} />
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
        <EditableTextRow
          label="Внутрішній артикул моделі"
          value={internalCode}
          onChange={setInternalCode}
        />
        <TextRow label="Артикул постачальника" value={supplierCode} onChange={setSupplierCode} />
        {!variantsEnabled && (
          <>
            <SkuCodeRow value={selectedSku.code} />
            <SkuBarcodeRow value={selectedSku.barcode} />
            <DetailRow
              align="left"
              label="Залишок"
              value={selectedSku.reserve + selectedSku.available}
            />
            <DetailRow align="left" label="Резерв" value={selectedSku.reserve} />
            <DetailRow
              align="left"
              label="Доступно"
              value={<span className="font-semibold text-primary">{selectedSku.available}</span>}
            />
            <DetailRow
              align="left"
              label="Комірки"
              value={
                <div className="flex flex-col gap-0.5">
                  {selectedSku.cells.map((cell) => (
                    <span key={cell.code}>
                      {cell.code} ({cell.qty} шт)
                    </span>
                  ))}
                </div>
              }
            />
            <DetailRow align="left" label="Партія" value={selectedSku.batch} />
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Button variant="outline">
                <History className="size-3.5" />
                Історія руху
              </Button>
              <Button variant="outline">
                <ArrowRightLeft className="size-3.5" />
                Перемістити
              </Button>
              <SkuMeasurementsDialog measurements={product.measurements} />
              <Button variant="outline">
                <Printer className="size-3.5" />
                Друк SKU
              </Button>
            </div>
          </>
        )}
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
