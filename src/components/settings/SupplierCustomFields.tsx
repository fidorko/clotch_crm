import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SupplierCustomFieldInput } from "@/lib/types/supplier";

export function SupplierCustomFields({
  fields,
  onChange,
}: {
  fields: SupplierCustomFieldInput[];
  onChange: (next: SupplierCustomFieldInput[]) => void;
}) {
  function update(index: number, patch: Partial<SupplierCustomFieldInput>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function remove(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Додаткові поля</span>
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={field.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="Назва поля"
            className="w-40 shrink-0"
          />
          <Input
            value={field.value}
            onChange={(e) => update(index, { value: e.target.value })}
            placeholder="Значення"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Видалити поле"
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...fields, { label: "", value: "" }])}
      >
        <Plus className="size-3.5" />
        Додати поле
      </Button>
    </div>
  );
}
