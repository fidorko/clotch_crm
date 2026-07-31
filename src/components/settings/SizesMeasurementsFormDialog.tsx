"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypeValuesEditor } from "@/components/settings/TypeValuesEditor";
import type { SizeTypeWithValues } from "@/server/data/size-types";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import { createSizeTypeAction, deleteSizeTypeAction, updateSizeTypeAction } from "@/app/settings/references/size-types-actions";
import {
  createMeasurementTypeAction,
  deleteMeasurementTypeAction,
  updateMeasurementTypeAction,
} from "@/app/settings/references/measurement-types-actions";

/** Попап «Розміри та заміри» — 2 незалежні прості довідники (тип → список значень) у вкладках, без жодної спільної таблиці/матриці між ними. */
export function SizesMeasurementsFormDialog({
  trigger,
  sizeTypes,
  measurementTypes,
}: {
  trigger: ReactElement;
  sizeTypes: SizeTypeWithValues[];
  measurementTypes: MeasurementTypeWithValues[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Розміри та заміри</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="sizes">
          <TabsList>
            <TabsTrigger value="sizes">Розміри</TabsTrigger>
            <TabsTrigger value="measurements">Заміри</TabsTrigger>
          </TabsList>
          <TabsContent value="sizes">
            <TypeValuesEditor
              groups={sizeTypes.map((t) => ({ id: t.id, name: t.name, values: t.values.map((v) => v.value) }))}
              addLabel="Додати тип"
              newTypeName="Типи розмірів (напр. «Одяг», «Взуття», «Джинси») і значення в кожному"
              valuesPlaceholder="Введіть розмір та натисніть Enter"
              emptyText="Типів розмірів ще немає — натисніть «Додати тип»"
              onCreate={() => createSizeTypeAction({ name: "Новий тип розміру", values: [] })}
              onUpdate={(id, name, values) => updateSizeTypeAction(id, { name, values })}
              onDelete={(id) => deleteSizeTypeAction(id)}
            />
          </TabsContent>
          <TabsContent value="measurements">
            <TypeValuesEditor
              groups={measurementTypes.map((t) => ({ id: t.id, name: t.name, values: t.values.map((v) => v.value) }))}
              addLabel="Додати тип"
              newTypeName="Типи замірів (напр. «Заміри сукні», «Заміри взуття») і точки заміру в кожному"
              valuesPlaceholder="Введіть назву заміру та натисніть Enter"
              emptyText="Типів замірів ще немає — натисніть «Додати тип»"
              onCreate={() => createMeasurementTypeAction({ name: "Новий тип заміру", values: [] })}
              onUpdate={(id, name, values) => updateMeasurementTypeAction(id, { name, values })}
              onDelete={(id) => deleteMeasurementTypeAction(id)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
