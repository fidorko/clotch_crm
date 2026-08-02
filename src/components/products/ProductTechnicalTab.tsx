"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextRow } from "@/components/ui/text-row";
import { cn } from "@/lib/utils";
import { TECHNICAL_FIELD_LABELS, type TechnicalFieldKey } from "@/lib/products/technical-fields";
import { updateTechnicalFieldLayoutAction } from "@/app/products/technical-layout-actions";
import { useProductEditor } from "@/components/products/ProductEditorContext";
import { ProductActivityLogSection } from "@/components/products/ProductActivityLogSection";
import type { Product } from "@/lib/types/product";
import type { SupplierRow } from "@/server/data/suppliers";
import type { ProductActivityLogEntry } from "@/server/data/product-activity-log";

function PackageDimensionsRow({
  length,
  width,
  height,
  onChangeLength,
  onChangeWidth,
  onChangeHeight,
}: {
  length: number;
  width: number;
  height: number;
  onChangeLength: (value: number) => void;
  onChangeWidth: (value: number) => void;
  onChangeHeight: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
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
      <p className="text-xs text-muted-foreground">Вказувати розміри у запакованому вигляді.</p>
    </div>
  );
}

function PackageWeightRow({
  weight,
  onChangeWeight,
}: {
  weight: number;
  onChangeWeight: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
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
      <p className="text-xs text-muted-foreground">Для створення ЕН Нова Пошта.</p>
    </div>
  );
}

// Постачальник — реальний довідник (settings → Довідники → Постачальники),
// value/options тут id, не назва (SelectValue отримує render-функцію, як і
// CategoriesTab, ui-kit.md).
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

function LayoutDragCard({ fieldKey }: { fieldKey: TechnicalFieldKey }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldKey,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex h-9 cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2 active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate text-sm text-foreground">{TECHNICAL_FIELD_LABELS[fieldKey]}</span>
    </div>
  );
}

export function ProductTechnicalTab({
  product,
  suppliers,
  packageDefaults,
  initialOrder,
  activityLog,
}: {
  product: Product;
  suppliers: SupplierRow[];
  packageDefaults: {
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    weightKg: number | null;
  };
  initialOrder: TechnicalFieldKey[];
  activityLog: ProductActivityLogEntry[];
}) {
  const router = useRouter();
  const { form, setField, isDraft } = useProductEditor();
  // Категорія обов'язкова для нового товару — та сама блокировка, що раніше
  // мала ціла ProductMetaPanel (products-characteristics.md), тепер лише тут,
  // бо ці поля переїхали в окрему вкладку.
  const isCategoryBlocked = isDraft && !form.categoryId;
  const meta = form.meta;
  const supplierId = form.supplierId;
  const supplierCode = meta.supplierCode;
  const packageLength = meta.packageLengthCm ?? packageDefaults.lengthCm ?? 0;
  const packageWidth = meta.packageWidthCm ?? packageDefaults.widthCm ?? 0;
  const packageHeight = meta.packageHeightCm ?? packageDefaults.heightCm ?? 0;
  const packageWeight = meta.packageWeightKg ?? packageDefaults.weightKg ?? 0;

  function setMeta<K extends keyof typeof meta>(key: K, value: (typeof meta)[K]) {
    setField("meta", { ...meta, [key]: value });
  }
  const setSupplierId = (value: string) => setField("supplierId", value);
  const setSupplierCode = (value: string) => setMeta("supplierCode", value);
  const setPackageLength = (value: number) => setMeta("packageLengthCm", value);
  const setPackageWidth = (value: number) => setMeta("packageWidthCm", value);
  const setPackageHeight = (value: number) => setMeta("packageHeightCm", value);
  const setPackageWeight = (value: number) => setMeta("packageWeightKg", value);

  const [editingLayout, setEditingLayout] = useState(false);
  const [draftOrder, setDraftOrder] = useState<TechnicalFieldKey[] | null>(null);
  const [isSavingLayout, startSavingLayout] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const order = draftOrder ?? initialOrder;

  function startEditingLayout() {
    setDraftOrder(initialOrder);
    setEditingLayout(true);
  }

  function cancelEditingLayout() {
    setDraftOrder(null);
    setEditingLayout(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraftOrder((prev) => {
      const current = prev ?? initialOrder;
      const oldIndex = current.indexOf(active.id as TechnicalFieldKey);
      const newIndex = current.indexOf(over.id as TechnicalFieldKey);
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function saveLayout() {
    const keys = draftOrder ?? initialOrder;
    startSavingLayout(async () => {
      await updateTechnicalFieldLayoutAction(keys.map((fieldKey, position) => ({ fieldKey, position })));
      setDraftOrder(null);
      setEditingLayout(false);
      router.refresh();
    });
  }

  function renderField(key: TechnicalFieldKey) {
    switch (key) {
      case "createdAt":
        return <DetailRow key={key} align="left" label="Створено" value={product.meta.createdAt} />;
      case "updatedAt":
        return <DetailRow key={key} align="left" label="Оновлено" value={product.meta.updatedAt} />;
      case "createdBy":
        return <DetailRow key={key} align="left" label="Створив" value={product.meta.createdBy} />;
      case "updatedBy":
        return (
          <DetailRow key={key} align="left" label="Останній редагував" value={product.meta.updatedBy} />
        );
      case "supplier":
        return (
          <SupplierSelectRow key={key} value={supplierId} suppliers={suppliers} onChange={setSupplierId} />
        );
      case "supplierCode":
        return (
          <TextRow key={key} label="Артикул постачальника" value={supplierCode} onChange={setSupplierCode} />
        );
      case "packageDimensions":
        return (
          <PackageDimensionsRow
            key={key}
            length={packageLength}
            width={packageWidth}
            height={packageHeight}
            onChangeLength={setPackageLength}
            onChangeWidth={setPackageWidth}
            onChangeHeight={setPackageHeight}
          />
        );
      case "packageWeight":
        return <PackageWeightRow key={key} weight={packageWeight} onChangeWeight={setPackageWeight} />;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {editingLayout ? "Перетягніть поля, щоб змінити порядок для всіх товарів" : null}
        </span>
        {editingLayout ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancelEditingLayout} disabled={isSavingLayout}>
              <X className="size-3.5" />
              Скасувати
            </Button>
            <Button type="button" size="sm" onClick={saveLayout} disabled={isSavingLayout}>
              Зберегти розташування
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startEditingLayout} className="ml-auto">
            <LayoutGrid className="size-3.5" />
            Редагувати розташування полів
          </Button>
        )}
      </div>

      <Card className={cn("gap-0 py-4", isCategoryBlocked && "pointer-events-none opacity-40")}>
        {editingLayout ? (
          <CardContent className="px-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {order.map((key) => (
                    <LayoutDragCard key={key} fieldKey={key} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        ) : (
          <CardContent className="flex flex-col divide-y divide-border px-4">
            {order.map(renderField)}
          </CardContent>
        )}
      </Card>

      <ProductActivityLogSection productId={product.id} initialEntries={activityLog} />
    </div>
  );
}
