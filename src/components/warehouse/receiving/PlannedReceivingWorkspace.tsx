"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatDateUa } from "@/lib/date-ua";
import type { ReceivingDocStatus, ReceivingItem } from "@/lib/types/receiving";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { SupplierRow } from "@/server/data/suppliers";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";
import type { ReceivingCustomFieldRow, UpdateReceivingDocumentInput } from "@/server/data/receiving";
import { acceptPlannedReceivingAction, completeReceivingDocumentAction } from "@/app/warehouse/receiving/actions";
import {
  createReceivingCustomFieldAction,
  deleteReceivingCustomFieldAction,
  deleteReceivingDocumentItemAction,
  deleteReceivingDocumentItemsAction,
  updateReceivingCustomFieldValueAction,
  updateReceivingDocumentAction,
  updateReceivingDocumentItemOrderedAction,
  updateReceivingDocumentItemReceivedAction,
  upsertReceivingDocumentItemAction,
} from "@/app/warehouse/receiving/new/actions";

const AUTOSAVE_DELAY_MS = 500;

// Документ уже створений (isPlanned обраний у випадному меню списку,
// warehouse-receiving.md) і одразу повністю редагований — нема окремого
// «розблокування»/гейту. Поля персистуються автозбереженням по ходу
// (тому й лишаються на випадок «пішов зі сторінки — повернувся»), а реальне
// оприходування на склад — одноразово при «Завершити» (decisions.md).
export function PlannedReceivingWorkspace({
  documentId,
  documentNumber,
  isPlanned,
  initialStatus,
  completedAtLabel: initialCompletedAtLabel,
  warehouses,
  suppliers,
  skuCatalog,
  dev,
  initialValues,
  initialCustomFields,
  initialItems,
}: {
  documentId: string;
  documentNumber: string;
  isPlanned: boolean;
  initialStatus: ReceivingDocStatus;
  completedAtLabel: string | null;
  warehouses: WarehouseRow[];
  suppliers: SupplierRow[];
  skuCatalog: ProductSkuCatalogItem[];
  dev: boolean;
  initialValues: PlannedReceivingFormValues;
  initialCustomFields: ReceivingCustomFieldRow[];
  initialItems: ReceivingItem[];
}) {
  const hasRealSuppliers = suppliers.length > 0;

  const [status, setStatus] = useState<ReceivingDocStatus>(initialStatus);
  const [completedAtLabel, setCompletedAtLabel] = useState<string | null>(initialCompletedAtLabel);
  const [values, setValues] = useState<PlannedReceivingFormValues>(initialValues);
  const [items, setItems] = useState<ReceivingItem[]>(initialItems);
  const [customFields, setCustomFields] = useState<ReceivingCustomFieldRow[]>(initialCustomFields);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Перший запуск ефекту пропускаємо — values і так дорівнюють щойно
  // завантаженим із сервера даним, зайвий запит не потрібен.
  const skipNextAutosave = useRef(true);
  const customFieldTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const itemTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const locked = status === "completed" || status === "completed_with_discrepancy";

  function buildPayload(): UpdateReceivingDocumentInput {
    return {
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

  // Автозбереження полів шапки — короткий debounce після останньої зміни,
  // без кнопки (conventions.md).
  useEffect(() => {
    if (locked) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildPayload читає values, не потребує в deps
  }, [values, locked]);

  function handleValuesChange(patch: Partial<PlannedReceivingFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  // «Зберегти» — лише для планового (пряма вказівка людини): дані й так
  // автозберігаються по ходу (debounce вище), кнопка форсує негайний запис
  // поточних значень (скасовує таймер, щоб не було подвійного запиту) і дає
  // видиме підтвердження «Збережено».
  async function handleSave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaving(true);
    try {
      await updateReceivingDocumentAction(documentId, buildPayload());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCustomField(label: string) {
    const row = await createReceivingCustomFieldAction(documentId, label);
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

  // Планове до «Прийняти на склад» — скан збільшує «Планову кількість»;
  // після (in_progress), і завжди для простого — «Прийнято».
  const scanTargetsOrdered = isPlanned && status === "awaiting_delivery";

  async function handleScanOrAdd(sku: ProductSkuCatalogItem) {
    const qtyField = scanTargetsOrdered ? "ordered" : "received";
    const result = await upsertReceivingDocumentItemAction(documentId, sku.id, qtyField, 1);
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productSkuId === sku.id);
      if (existingIndex === -1) {
        return [
          ...prev,
          {
            id: result.id,
            productSkuId: sku.id,
            sku: sku.sku,
            barcode: sku.barcode,
            photoUrl: sku.photoUrl,
            productName: sku.productName,
            color: sku.color,
            colorHex: sku.colorHex,
            size: sku.size,
            ordered: result.ordered,
            received: result.received,
            status: "not_accepted",
          },
        ];
      }
      return prev.map((item, i) =>
        i === existingIndex ? { ...item, ordered: result.ordered, received: result.received } : item
      );
    });
  }

  function handleUpdateOrdered(itemId: string, ordered: number) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ordered } : item)));
    if (itemTimers.current[itemId]) clearTimeout(itemTimers.current[itemId]);
    itemTimers.current[itemId] = setTimeout(() => {
      void updateReceivingDocumentItemOrderedAction(itemId, ordered);
    }, AUTOSAVE_DELAY_MS);
  }

  function handleUpdateReceived(itemId: string, received: number) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, received } : item)));
    if (itemTimers.current[itemId]) clearTimeout(itemTimers.current[itemId]);
    itemTimers.current[itemId] = setTimeout(() => {
      void updateReceivingDocumentItemReceivedAction(itemId, received);
    }, AUTOSAVE_DELAY_MS);
  }

  function handleRemoveItem(itemId: string) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    void deleteReceivingDocumentItemAction(itemId);
  }

  function handleRemoveItems(itemIds: string[]) {
    setItems((prev) => prev.filter((item) => !itemIds.includes(item.id)));
    void deleteReceivingDocumentItemsAction(itemIds);
  }

  // Незворотно (нема шляху назад, пряма вказівка людини) — не відкочуємо
  // локальний стан у catch, лише не даємо кнопці зависнути на помилці.
  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptPlannedReceivingAction(documentId);
      setStatus("in_progress");
    } finally {
      setAccepting(false);
    }
  }

  // Так само незворотно й тут реально «оприходується» на склад (одноразово,
  // server-side, completeReceivingDocument). Статус/дата — напряму з
  // відповіді дії, не через router.refresh() (useState(initialStatus) не
  // перечитує пропси при ре-рендері серверного дерева — інакше акт
  // відкривався лише після F5).
  async function handleComplete() {
    setCompleting(true);
    try {
      const result = await completeReceivingDocumentAction(documentId);
      setStatus(result.status);
      setCompletedAtLabel(formatDateUa(result.completedAt));
    } finally {
      setCompleting(false);
    }
  }

  const positions = items.length;
  const expected = items.reduce((sum, item) => sum + item.ordered, 0);
  const received = items.reduce((sum, item) => sum + item.received, 0);
  const discrepancies = items.filter((item) => item.received !== item.ordered).length;

  // «Завершити» заблоковане, поки не заповнені постачальник і відповідальна
  // особа (тип — уже завжди обраний, фіксується при створенні) — пряма
  // вказівка людини.
  const missingForComplete: string[] = [];
  if (!values.supplierId) missingForComplete.push("постачальника");
  if (!values.responsible.trim()) missingForComplete.push("відповідальну особу");
  const completeBlockedReason =
    missingForComplete.length > 0 ? `Оберіть ${missingForComplete.join(" і ")}, щоб завершити документ` : null;

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="PlannedReceivingHeader" enabled={dev}>
        <PlannedReceivingHeader
          documentNumber={documentNumber}
          isPlanned={isPlanned}
          status={status}
          locked={locked}
          completedAtLabel={completedAtLabel}
          onSave={isPlanned && !locked ? handleSave : undefined}
          saving={saving}
          justSaved={justSaved}
          onAccept={isPlanned && status === "awaiting_delivery" ? handleAccept : undefined}
          accepting={accepting}
          onComplete={status === "in_progress" ? handleComplete : undefined}
          completeBlockedReason={status === "in_progress" ? completeBlockedReason : null}
          completing={completing}
        />
      </DevBlockLabel>

      <DevBlockLabel name="PlannedReceivingWorkspace" enabled={dev}>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_360px]">
            <PlannedReceivingItemsTable
              showOrderedColumn={isPlanned}
              orderedEditable={isPlanned && !locked}
              receivedEditable={(!isPlanned || status === "in_progress") && !locked}
              locked={locked}
              items={items}
              skuCatalog={skuCatalog}
              onScanOrAdd={handleScanOrAdd}
              onUpdateOrdered={handleUpdateOrdered}
              onUpdateReceived={handleUpdateReceived}
              onRemoveItem={handleRemoveItem}
              onRemoveItems={handleRemoveItems}
            />

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
                isPlanned={isPlanned}
                locked={locked}
              />
              <ReceivingSummary
                stats={
                  isPlanned
                    ? [
                        { label: "Позицій", value: positions },
                        { label: "Планова кількість", value: expected },
                        { label: "Прийнято", value: received },
                        { label: "Розбіжностей", value: discrepancies, tone: "destructive" },
                      ]
                    : [
                        { label: "Позицій", value: positions },
                        { label: "Прийнято", value: received },
                      ]
                }
              />
              <ReceivingQuickActions documentId={documentId} completed={locked} />
            </div>
          </div>
        </div>
      </DevBlockLabel>
    </div>
  );
}
