"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TtnInput, type TtnCarrier } from "@/components/ui/ttn-input";
import type { ReceivingCustomFieldRow } from "@/server/data/receiving";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { SupplierRow } from "@/server/data/suppliers";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

const TTN_CARRIER_LABEL: Record<TtnCarrier, string> = {
  nova_poshta: "Нова пошта",
  ukrposhta: "Укрпошта",
};

export interface PlannedReceivingFormValues {
  supplierId: string | null;
  document: string;
  date: string;
  warehouseId: string;
  responsible: string;
  comment: string;
  ttnCarrier: TtnCarrier | null;
  ttnNumber: string;
}

export function PlannedReceivingInfoForm({
  values,
  onChange,
  warehouses,
  suppliers,
  customFields,
  onAddCustomField,
  onChangeCustomFieldValue,
  onRemoveCustomField,
}: {
  values: PlannedReceivingFormValues;
  onChange: (patch: Partial<PlannedReceivingFormValues>) => void;
  warehouses: WarehouseRow[];
  suppliers: SupplierRow[];
  customFields: ReceivingCustomFieldRow[];
  onAddCustomField: (label: string) => void;
  onChangeCustomFieldValue: (id: string, value: string) => void;
  onRemoveCustomField: (id: string) => void;
}) {
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const hasRealSuppliers = suppliers.length > 0;
  const supplierValue = values.supplierId ?? undefined;

  function submitNewField() {
    const label = newFieldLabel.trim();
    if (!label) return;
    onAddCustomField(label);
    setNewFieldLabel("");
    setAddingField(false);
  }

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Інформація про надходження</span>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Постачальник</FieldLabel>
          {hasRealSuppliers ? (
            <Select value={supplierValue} onValueChange={(v) => v && onChange({ supplierId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => suppliers.find((s) => s.id === values.supplierId)?.name ?? "Оберіть постачальника"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">Ще немає жодного постачальника — додайте в налаштуваннях</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Документ постачальника</FieldLabel>
          <Input value={values.document} onChange={(e) => onChange({ document: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Дата план</FieldLabel>
            <DateInput value={values.date} onChange={(date) => onChange({ date })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Склад</FieldLabel>
            <Select value={values.warehouseId || undefined} onValueChange={(v) => v && onChange({ warehouseId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() => warehouses.find((w) => w.id === values.warehouseId)?.name ?? "Оберіть склад"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>ЕН (не обов&apos;язково)</FieldLabel>
          <div className="flex items-center gap-4">
            {(Object.keys(TTN_CARRIER_LABEL) as TtnCarrier[]).map((carrier) => (
              <label key={carrier} className="flex items-center gap-1.5 text-sm text-foreground">
                <Checkbox
                  checked={values.ttnCarrier === carrier}
                  onCheckedChange={() =>
                    onChange({
                      ttnCarrier: values.ttnCarrier === carrier ? null : carrier,
                      ttnNumber: "",
                    })
                  }
                />
                {TTN_CARRIER_LABEL[carrier]}
              </label>
            ))}
          </div>
          {values.ttnCarrier && (
            <TtnInput
              carrier={values.ttnCarrier}
              value={values.ttnNumber}
              onChange={(ttnNumber) => onChange({ ttnNumber })}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          {customFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel>{field.label}</FieldLabel>
                <button
                  type="button"
                  onClick={() => onRemoveCustomField(field.id)}
                  aria-label={`Видалити поле ${field.label}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <Input
                value={field.value ?? ""}
                onChange={(e) => onChangeCustomFieldValue(field.id, e.target.value)}
              />
            </div>
          ))}

          {addingField ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewField()}
                placeholder="Назва поля"
                className="h-8"
              />
              <Button size="sm" onClick={submitNewField}>
                Зберегти
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingField(false)}>
                Скасувати
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-fit" onClick={() => setAddingField(true)}>
              <Plus className="size-3.5" />
              Додати поле
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Відповідальний</FieldLabel>
          <Input value={values.responsible} onChange={(e) => onChange({ responsible: e.target.value })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Коментар</FieldLabel>
          <Textarea value={values.comment} onChange={(e) => onChange({ comment: e.target.value })} rows={2} />
        </div>
      </CardContent>
    </Card>
  );
}
