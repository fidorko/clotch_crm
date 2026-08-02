"use client";

import { useState } from "react";
import { ArrowRightLeft, History, Pencil, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { EditableTextRow } from "@/components/ui/editable-text-row";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DynamicCharacteristicsSection } from "@/components/products/characteristics/DynamicCharacteristicsSection";
import type { MaterialCompositionEntry } from "@/components/products/characteristics/MaterialCompositionRow";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import { selectedSku } from "@/lib/mocks/products";
import { useProductEditor } from "@/components/products/ProductEditorContext";

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

export function ProductMetaPanel({
  variantsEnabled,
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
}: {
  variantsEnabled: boolean;
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
}) {
  const { form, setField } = useProductEditor();
  const meta = form.meta;
  const info = form.info;

  const description = info.description;
  const internalCode = meta.internalCode;
  const tags = form.tags;

  function setMeta<K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) {
    setField("meta", { ...meta, [key]: value });
  }

  function setInfo<K extends keyof typeof info>(key: K, value: (typeof info)[K]) {
    setField("info", { ...info, [key]: value });
  }

  const setDescription = (value: string) => setInfo("description", value);
  const setInternalCode = (value: string) => setMeta("internalCode", value);
  const setTags = (value: string[]) => setField("tags", value);

  return (
    <Card className="h-full gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
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
              <Button variant="outline">
                <Printer className="size-3.5" />
                Друк SKU
              </Button>
            </div>
          </>
        )}
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
