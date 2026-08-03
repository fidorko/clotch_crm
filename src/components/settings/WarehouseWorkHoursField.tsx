"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { WarehouseWorkHourInput } from "@/lib/types/warehouse";

// Довільна кількість груп днів (не 7 фіксованих колонок) — за зразком
// людини: "Пн-Пт 09:00-18:00", "Сб 09:00-15:00", "Нд Вихідний". Чекбокс
// "Вихідний" ховає час і показує задизейблений напис замість нього.
export function WarehouseWorkHoursField({
  value,
  onChange,
}: {
  value: WarehouseWorkHourInput[];
  onChange: (value: WarehouseWorkHourInput[]) => void;
}) {
  function update(index: number, patch: Partial<WarehouseWorkHourInput>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([
      ...value,
      { id: crypto.randomUUID(), label: "", isDayOff: false, from: "09:00", to: "18:00" },
    ]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">Час роботи</span>
      <div className="flex flex-col gap-2">
        {value.map((row, index) => (
          <div key={row.id} className="flex items-center gap-1.5">
            <Input
              value={row.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder="Пн-Пт"
              className="w-20"
            />
            {row.isDayOff ? (
              <Input value="Вихідний" disabled className="flex-1" />
            ) : (
              <>
                <Input
                  type="time"
                  value={row.from}
                  onChange={(e) => update(index, { from: e.target.value })}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={row.to}
                  onChange={(e) => update(index, { to: e.target.value })}
                  className="flex-1"
                />
              </>
            )}
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox
                checked={row.isDayOff}
                onCheckedChange={(checked) => update(index, { isDayOff: checked === true })}
              />
              Вихідний
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Прибрати рядок годин роботи"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          aria-label="Додати рядок годин роботи"
          onClick={add}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
