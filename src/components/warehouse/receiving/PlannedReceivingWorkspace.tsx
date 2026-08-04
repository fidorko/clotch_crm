"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { PlannedReceivingHeader } from "@/components/warehouse/receiving/PlannedReceivingHeader";
import { PlannedReceivingItemsTable } from "@/components/warehouse/receiving/PlannedReceivingItemsTable";
import {
  PlannedReceivingInfoForm,
  type PlannedReceivingFormValues,
} from "@/components/warehouse/receiving/PlannedReceivingInfoForm";
import { ReceivingSummary } from "@/components/warehouse/receiving/ReceivingSummary";
import { ReceivingQuickActions } from "@/components/warehouse/receiving/ReceivingQuickActions";
import { parseDateInputToIso } from "@/components/ui/date-input";
import type { ReceivingItem } from "@/lib/types/receiving";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { SupplierRow } from "@/server/data/suppliers";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";
import type { ReceivingCustomFieldRow, ReceivingDocumentInput } from "@/server/data/receiving";
import {
  createReceivingCustomFieldAction,
  createReceivingDocumentAction,
  deleteReceivingCustomFieldAction,
  updateReceivingCustomFieldValueAction,
  updateReceivingDocumentAction,
} from "@/app/warehouse/receiving/new/actions";

const AUTOSAVE_DELAY_MS = 500;

export function PlannedReceivingWorkspace({
  warehouses,
  suppliers,
  skuCatalog,
  defaultWarehouseId,
  dev,
  initialDocumentId = null,
  initialValues,
  initialCustomFields = [],
}: {
  warehouses: WarehouseRow[];
  suppliers: SupplierRow[];
  skuCatalog: ProductSkuCatalogItem[];
  defaultWarehouseId?: string;
  dev: boolean;
  // Відкриття існуючого документа (клік по «Номер документа» в списку) —
  // передається вже готовим набором значень з server component (page.tsx),
  // сама сторінка нічого не конвертує (ISO→UI — на межі, при читанні).
  initialDocumentId?: string | null;
  initialValues?: PlannedReceivingFormValues;
  initialCustomFields?: ReceivingCustomFieldRow[];
}) {
  const hasRealSuppliers = suppliers.length > 0;

  const [documentId, setDocumentId] = useState<string | null>(initialDocumentId);
  const [values, setValues] = useState<PlannedReceivingFormValues>(
    initialValues ?? {
      supplierId: suppliers[0]?.id ?? null,
      document: "",
      date: "",
      warehouseId: defaultWarehouseId ?? warehouses[0]?.id ?? "",
      responsible: "",
      comment: "",
      ttnCarrier: null,
      ttnNumber: "",
    }
  );
  // Позиції (SKU/кількості) поки не персистуються (warehouse-receiving.md,
  // "Відкрито") — при відкритті наявного документа список завжди порожній.
  const [items, setItems] = useState<ReceivingItem[]>([]);
  const [customFields, setCustomFields] = useState<ReceivingCustomFieldRow[]>(initialCustomFields);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(true);
  const customFieldTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Замикається на `values` поточного рендеру — функцію завжди перестворює
  // React при кожному рендері, тож застарілого значення тут не буває (ref
  // для цього не потрібен, react-hooks/refs забороняє мутувати ref у рендері).
  function buildPayload(): ReceivingDocumentInput {
    return {
      type: "planned",
      supplierId: hasRealSuppliers ? values.supplierId : null,
      warehouseId: values.warehouseId || null,
      plannedDate: parseDateInputToIso(values.date),
      supplierDocument: values.document,
      ttnCarrier: values.ttnCarrier,
      ttnNumber: values.ttnNumber,
      responsiblePerson: values.responsible,
      comment: values.comment,
    };
  }

  // Автозбереження полів форми ПІСЛЯ першого явного «Зберегти» — той самий
  // принцип, що картка товару (conventions.md, "Форми редагування"):
  // короткий debounce після останньої зміни, без кнопки. Перший запуск
  // одразу після створення документа пропускаємо — дані щойно й так пішли
  // разом зі створенням.
  useEffect(() => {
    if (!documentId) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void updateReceivingDocumentAction(documentId, buildPayload());
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildPayload читає valuesRef, не потребує в deps
  }, [documentId, values]);

  async function ensureDocumentId(): Promise<string> {
    if (documentId) return documentId;
    const created = await createReceivingDocumentAction(buildPayload());
    skipNextAutosave.current = true;
    setDocumentId(created.id);
    return created.id;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const id = await ensureDocumentId();
      await updateReceivingDocumentAction(id, buildPayload());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  function handleValuesChange(patch: Partial<PlannedReceivingFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  async function handleAddCustomField(label: string) {
    const id = await ensureDocumentId();
    const row = await createReceivingCustomFieldAction(id, label);
    setCustomFields((prev) => [...prev, row]);
  }

  function handleChangeCustomFieldValue(id: string, value: string) {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, value } : f)));
    if (customFieldTimers.current[id]) clearTimeout(customFieldTimers.current[id]);
    customFieldTimers.current[id] = setTimeout(() => {
      void updateReceivingCustomFieldValueAction(id, value);
    }, AUTOSAVE_DELAY_MS);
  }

  async function handleRemoveCustomField(id: string) {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    await deleteReceivingCustomFieldAction(id);
  }

  const positions = items.length;
  const expected = items.reduce((sum, item) => sum + item.ordered, 0);
  const received = items.reduce((sum, item) => sum + item.received, 0);
  const discrepancies = items.filter((item) => item.received !== item.ordered).length;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="PlannedReceivingHeader" enabled={dev}>
        <PlannedReceivingHeader
          warehouseId={values.warehouseId}
          saveSlot={
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {justSaved ? <Check className="size-4" /> : <Save className="size-4" />}
              {justSaved ? "Збережено" : "Зберегти"}
            </Button>
          }
        />
      </DevBlockLabel>

      <DevBlockLabel name="PlannedReceivingWorkspace" enabled={dev}>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_360px]">
            <PlannedReceivingItemsTable items={items} onItemsChange={setItems} skuCatalog={skuCatalog} />

            <div className="flex flex-col gap-4">
              <PlannedReceivingInfoForm
                values={values}
                onChange={handleValuesChange}
                warehouses={warehouses}
                suppliers={suppliers}
                customFields={customFields}
                onAddCustomField={handleAddCustomField}
                onChangeCustomFieldValue={handleChangeCustomFieldValue}
                onRemoveCustomField={handleRemoveCustomField}
              />
              <ReceivingSummary
                stats={[
                  { label: "Позицій", value: positions },
                  { label: "Очікується", value: expected },
                  { label: "Прийнято", value: received },
                  { label: "Розбіжностей", value: discrepancies, tone: "destructive" },
                ]}
              />
              <ReceivingQuickActions type="planned" />
            </div>
          </div>
        </div>
      </DevBlockLabel>
    </div>
  );
}
