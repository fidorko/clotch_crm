"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TypeValuesEditor } from "@/components/settings/TypeValuesEditor";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import {
  createMeasurementTypeAction,
  deleteMeasurementTypeAction,
  updateMeasurementTypeAction,
} from "@/app/settings/references/measurement-types-actions";

/** Попап «Заміри» — тип → список значень, `TypeValuesEditor` (той самий, що раніше жив у вкладці SizesMeasurementsFormDialog). */
export function MeasurementTypesFormDialog({
  trigger,
  measurementTypes,
}: {
  trigger: ReactElement;
  measurementTypes: MeasurementTypeWithValues[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Заміри</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
