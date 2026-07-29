"use client";

import { useState } from "react";
import { ImageIcon, Plus, Ruler, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MEASUREMENT_TYPE_OPTIONS } from "@/lib/constants/measurement-types";
import type { ProductMeasurement } from "@/lib/types/product";

const MEASUREMENT_TYPE_LABELS = MEASUREMENT_TYPE_OPTIONS.map((option) => option.label);

function imageForType(label: string) {
  return MEASUREMENT_TYPE_OPTIONS.find((option) => option.label === label)?.imageUrl ?? "";
}

export function SkuMeasurementsDialog({
  measurements: initialMeasurements,
}: {
  measurements: ProductMeasurement[];
}) {
  const [measurements, setMeasurements] = useState(initialMeasurements);

  function updateType(id: string, type: string) {
    setMeasurements((prev) => prev.map((m) => (m.id === id ? { ...m, type } : m)));
  }

  function updateValue(id: string, valueCm: number) {
    setMeasurements((prev) => prev.map((m) => (m.id === id ? { ...m, valueCm } : m)));
  }

  function addMeasurement() {
    setMeasurements((prev) => [
      ...prev,
      { id: `m-${crypto.randomUUID()}`, type: "", valueCm: 0 },
    ]);
  }

  function removeMeasurement(id: string) {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Ruler className="size-3.5" />
        Заміри
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Заміри SKU</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border">
          {measurements.map((measurement) => {
            const imageUrl = imageForType(measurement.type);
            return (
              <div key={measurement.id} className="flex items-center gap-3 py-2">
                <Dialog>
                  <DialogTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`Збільшити зображення заміру${measurement.type ? `: ${measurement.type}` : ""}`}
                        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-muted-foreground/40"
                      />
                    }
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- зображення заміру, тимчасово без next/image
                      <img
                        src={imageUrl}
                        alt={measurement.type}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>{measurement.type || "Зображення заміру"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- зображення заміру, тимчасово без next/image
                        <img
                          src={imageUrl}
                          alt={measurement.type}
                          className="size-full rounded-lg object-cover"
                        />
                      ) : (
                        <ImageIcon className="size-10 text-muted-foreground/50" />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Combobox
                  items={MEASUREMENT_TYPE_LABELS}
                  value={measurement.type}
                  onValueChange={(value) => updateType(measurement.id, (value as string) ?? "")}
                >
                  <ComboboxInputGroup className="min-w-0 flex-1">
                    <ComboboxInput
                      placeholder="Почніть вводити назву заміру"
                      className="h-7 text-sm font-medium"
                    />
                    <ComboboxTrigger />
                  </ComboboxInputGroup>
                  <ComboboxContent>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxContent>
                </Combobox>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={measurement.valueCm}
                    onChange={(e) => updateValue(measurement.id, Number(e.target.value))}
                    className="h-7 w-16 px-1.5 text-right text-sm"
                  />
                  <span className="text-sm text-muted-foreground">см</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Видалити замір"
                  onClick={() => removeMeasurement(measurement.id)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          variant="link"
          className="h-auto w-fit px-0 py-0 text-sm"
          onClick={addMeasurement}
        >
          <Plus className="size-3.5" />
          Додати ще один замір
        </Button>
      </DialogContent>
    </Dialog>
  );
}
