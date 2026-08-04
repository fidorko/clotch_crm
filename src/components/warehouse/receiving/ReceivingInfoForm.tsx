"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_RESPONSIBLE_PEOPLE, MOCK_SUPPLIERS } from "@/lib/mocks/receiving";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { SupplierRow } from "@/server/data/suppliers";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

// Швидке/фактичне надходження — планове має власну форму
// (PlannedReceivingInfoForm: TTN, довільні поля, автозбереження,
// warehouse-receiving.md), цей компонент лишається простим і без БД.
export function ReceivingInfoForm({
  warehouses,
  suppliers,
  defaultWarehouseId,
}: {
  warehouses: WarehouseRow[];
  suppliers: SupplierRow[];
  defaultWarehouseId?: string;
}) {
  const [supplier, setSupplier] = useState(suppliers[0]?.name ?? MOCK_SUPPLIERS[0]);
  const [document, setDocument] = useState("Накладна № 4587 від 24.05.2024");
  const [date, setDate] = useState("24.05.2024");
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? warehouses[0]?.id ?? "");
  const [responsible, setResponsible] = useState(MOCK_RESPONSIBLE_PEOPLE[0]);
  const [comment, setComment] = useState("Без коментарів");

  const supplierOptions = suppliers.length > 0 ? suppliers.map((s) => s.name) : MOCK_SUPPLIERS;

  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Інформація про надходження</span>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Постачальник</FieldLabel>
          <Select value={supplier} onValueChange={(v) => v && setSupplier(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supplierOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Документ постачальника</FieldLabel>
          <Input value={document} onChange={(e) => setDocument(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Дата надходження</FieldLabel>
            <DateInput value={date} onChange={setDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Склад</FieldLabel>
            <Select value={warehouseId || undefined} onValueChange={(v) => v && setWarehouseId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() => warehouses.find((w) => w.id === warehouseId)?.name ?? "Оберіть склад"}
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
          <FieldLabel>Відповідальний</FieldLabel>
          <Select value={responsible} onValueChange={(v) => v && setResponsible(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_RESPONSIBLE_PEOPLE.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Коментар</FieldLabel>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </div>
      </CardContent>
    </Card>
  );
}
