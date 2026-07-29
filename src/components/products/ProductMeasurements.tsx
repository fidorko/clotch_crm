"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { MEASUREMENT_TYPE_OPTIONS } from "@/lib/constants/measurement-types";
import type { ProductMeasurement } from "@/lib/types/product";

const MEASUREMENT_TYPE_LABELS = MEASUREMENT_TYPE_OPTIONS.map((option) => option.label);

export function ProductMeasurements({
  measurements: initialMeasurements,
}: {
  measurements: ProductMeasurement[];
}) {
  const [expanded, setExpanded] = useState(true);
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
    <Card className="h-full gap-0 py-4">
      <CardHeader className="px-4">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <CardTitle className="text-sm font-medium">Заміри виробу</CardTitle>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="flex flex-col divide-y divide-border px-4">
          {measurements.map((measurement) => (
            <div key={measurement.id} className="flex items-center gap-2 py-1.5">
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
                  {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
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
          ))}
          <div className="py-2">
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 py-0 text-sm"
              onClick={addMeasurement}
            >
              <Plus className="size-3.5" />
              Додати ще один замір
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
