"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TtnInput, type TtnCarrier } from "@/components/ui/ttn-input";
import { cn } from "@/lib/utils";
import { DEV_USER } from "@/lib/constants/dev-user";
import type { ReceivingCustomFieldRow } from "@/server/data/receiving";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { SupplierRow } from "@/server/data/suppliers";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

// Постачальник + відповідальна особа — обов'язкові для «Завершити» (не для
// сканування, воно активне одразу) — зірочка з підказкою через title, без
// нового ui-kit компонента заради двох місць використання.
function RequiredFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {children}{" "}
      <span className="text-destructive" title="Обов'язкове поле — потрібне, щоб завершити документ">
        *
      </span>
    </span>
  );
}

const TTN_CARRIER_LABEL: Record<TtnCarrier, string> = {
  nova_poshta: "Нова пошта",
  ukrposhta: "Укрпошта",
};

// Поки нема авторизації/таблиці користувачів — єдина можлива відповідальна
// особа - DEV_USER (той самий підхід, що вже застосований у products.ts
// для created_by/updated_by, TODO(auth)). Список стане реальним переліком
// користувачів тенанта, коли з'явиться авторизація.
const RESPONSIBLE_PERSON_OPTIONS = [DEV_USER.name];

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
  isPlanned,
  locked,
}: {
  values: PlannedReceivingFormValues;
  onChange: (patch: Partial<PlannedReceivingFormValues>) => void;
  warehouses: WarehouseRow[];
  suppliers: SupplierRow[];
  customFields: ReceivingCustomFieldRow[];
  onAddCustomField: (label: string) => void;
  onChangeCustomFieldValue: (id: string, value: string) => void;
  onRemoveCustomField: (id: string) => void;
  // «Планова дата поставки» — лише для планового (isPlanned); для простого
  // дата надходження = дата сканування, окремого поля нема (пряма вказівка
  // людини). locked — документ завершено, усі поля реально disabled.
  isPlanned: boolean;
  locked: boolean;
}) {
  const [addingField, setAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const hasRealSuppliers = suppliers.length > 0;
  const supplierValue = values.supplierId ?? "";
  const selectedWarehouseName = warehouses.find((w) => w.id === values.warehouseId)?.name;

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
          <RequiredFieldLabel>Постачальник</RequiredFieldLabel>
          {hasRealSuppliers ? (
            <Select
              value={supplierValue}
              onValueChange={(v) => v && onChange({ supplierId: v })}
              disabled={locked}
            >
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
          <Input
            value={values.document}
            onChange={(e) => onChange({ document: e.target.value })}
            disabled={locked}
          />
        </div>

        <div className={cn("grid gap-3", isPlanned ? "grid-cols-2" : "grid-cols-1")}>
          {isPlanned && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Планова дата поставки</FieldLabel>
              <DatePicker
                value={values.date}
                onChange={(date) => onChange({ date })}
                placeholder="Оберіть дату"
                disabled={locked}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Склад</FieldLabel>
            {values.warehouseId ? (
              // Уже обраний до переходу на цю сторінку (з картки конкретного
              // складу, ?warehouseId=) — далі не змінюється (пряма вказівка людини).
              <span className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-foreground">
                {selectedWarehouseName ?? "—"}
              </span>
            ) : (
              <Select
                value={values.warehouseId || ""}
                onValueChange={(v) => v && onChange({ warehouseId: v })}
                disabled={locked}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{() => "Оберіть склад"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>ЕН (не обов&apos;язково)</FieldLabel>
          <div className="flex items-center gap-4">
            {(Object.keys(TTN_CARRIER_LABEL) as TtnCarrier[]).map((carrier) => (
              <label key={carrier} className="flex items-center gap-1.5 text-sm text-foreground">
                <Checkbox
                  checked={values.ttnCarrier === carrier}
                  disabled={locked}
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
              disabled={locked}
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
                  disabled={locked}
                  aria-label={`Видалити поле ${field.label}`}
                  className="text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <Input
                value={field.value ?? ""}
                onChange={(e) => onChangeCustomFieldValue(field.id, e.target.value)}
                disabled={locked}
              />
            </div>
          ))}

          {!locked &&
            (addingField ? (
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
            ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <RequiredFieldLabel>Відповідальна особа</RequiredFieldLabel>
          <Select
            value={values.responsible || ""}
            onValueChange={(v) => v && onChange({ responsible: v })}
            disabled={locked}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{() => values.responsible || "Оберіть відповідальну особу"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RESPONSIBLE_PERSON_OPTIONS.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Коментар</FieldLabel>
          <Textarea
            value={values.comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            rows={2}
            disabled={locked}
          />
        </div>
      </CardContent>
    </Card>
  );
}
