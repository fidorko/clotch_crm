"use client";

import type { ReactElement } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TypeValuesEditor } from "@/components/settings/TypeValuesEditor";
import type { SizeTypeWithValues } from "@/server/data/size-types";
import { createSizeTypeAction, deleteSizeTypeAction, updateSizeTypeAction } from "@/app/settings/references/size-types-actions";

/** Попап «Розміри» — тип → список значень, `TypeValuesEditor` (той самий, що раніше жив у вкладці SizesMeasurementsFormDialog). */
export function SizeTypesFormDialog({
  trigger,
  sizeTypes,
}: {
  trigger: ReactElement;
  sizeTypes: SizeTypeWithValues[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Розміри</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
