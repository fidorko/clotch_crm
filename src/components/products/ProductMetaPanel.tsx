"use client";

import { useState } from "react";
import { ArrowRightLeft, History, Pencil, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { EditableTextRow } from "@/components/ui/editable-text-row";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkuMeasurementsDialog } from "@/components/products/SkuMeasurementsDialog";
import { TextRow } from "@/components/ui/text-row";
import { Textarea } from "@/components/ui/textarea";
import { DynamicCharacteristicsSection } from "@/components/products/characteristics/DynamicCharacteristicsSection";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import { selectedSku } from "@/lib/mocks/products";
import type { Product } from "@/lib/types/product";
import type { SupplierRow } from "@/server/data/suppliers";
import { useProductEditor } from "@/components/products/ProductEditorContext";

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
  dynamicRows,
  layoutEditMode,
  characteristics,
  onCharacteristicChange,
  careInstructions,
  fabricTypes,
  materials,
  materialComposition,
  onMaterialCompositionChange,
  tagsKey,
  suppliersPinned,
  packageDefaults,
}: {
  product: Product;
  variantsEnabled: boolean;
  suppliers: SupplierRow[];
  dynamicRows: ResolvedCharacteristicRow[];
  layoutEditMode: boolean;
  characteristics: Record<string, string[]>;
  onCharacteristicChange: (key: string, valueIds: string[]) => void;
  careInstructions: CareInstructionRow[];
  fabricTypes: FabricTypeDetail[];
  materials: MaterialRow[];
  materialComposition: MaterialCompositionEntry[];
  onMaterialCompositionChange: (entries: MaterialCompositionEntry[]) => void;
  tagsKey: string | null;
  suppliersPinned: boolean;
  packageDefaults: {
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    weightKg: number | null;
  };
}) {
  const { form, setField } = useProductEditor();
  const meta = form.meta;
  const info = form.info;

  const supplierId = form.supplierId;
  const description = info.description;
  const internalCode = meta.internalCode;
  const supplierCode = meta.supplierCode;
  // Власне значення (nullable) ?? ефективний дефолт категорії ?? 0 — той самий
  // принцип успадкування, що categories.default_* (lib/categories/inheritance.ts),
  // на рівень нижче: від категорії до товару. Редагування поля робить його
  // власним назавжди (немає UI-способу скинути назад, як і на рівні категорій).
  const packageLength = meta.packageLengthCm ?? packageDefaults.lengthCm ?? 0;
  const packageWidth = meta.packageWidthCm ?? packageDefaults.widthCm ?? 0;
  const packageHeight = meta.packageHeightCm ?? packageDefaults.heightCm ?? 0;
  const packageWeight = meta.packageWeightKg ?? packageDefaults.weightKg ?? 0;
  const tags = form.tags;

  function setMeta<K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) {
    setField("meta", { ...meta, [key]: value });
  }

  function setInfo<K extends keyof typeof info>(key: K, value: (typeof info)[K]) {
    setField("info", { ...info, [key]: value });
  }

  const setSupplierId = (value: string) => setField("supplierId", value);
  const setDescription = (value: string) => setInfo("description", value);
  const setInternalCode = (value: string) => setMeta("internalCode", value);
  const setSupplierCode = (value: string) => setMeta("supplierCode", value);
  const setPackageLength = (value: number) => setMeta("packageLengthCm", value);
  const setPackageWidth = (value: number) => setMeta("packageWidthCm", value);
  const setPackageHeight = (value: number) => setMeta("packageHeightCm", value);
  const setPackageWeight = (value: number) => setMeta("packageWeightKg", value);
  const setTags = (value: string[]) => setField("tags", value);

  return (
    <Card className="h-full gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <DetailRow align="left" label="Створено" value={product.meta.createdAt} />
        <DetailRow align="left" label="Оновлено" value={product.meta.updatedAt} />
        <DetailRow align="left" label="Створив" value={product.meta.createdBy} />
        <DetailRow align="left" label="Останній редагував" value={product.meta.updatedBy} />
        {suppliersPinned && (
          <SupplierSelectRow value={supplierId} suppliers={suppliers} onChange={setSupplierId} />
        )}
        <DynamicCharacteristicsSection
          dropId="meta-panel"
          rows={dynamicRows}
          layoutEditMode={layoutEditMode}
          characteristics={characteristics}
          onCharacteristicChange={onCharacteristicChange}
          careInstructions={careInstructions}
          fabricTypes={fabricTypes}
          materials={materials}
          materialComposition={materialComposition}
          onMaterialCompositionChange={onMaterialCompositionChange}
          tagsKey={tagsKey}
          tags={tags}
          onTagsChange={setTags}
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
