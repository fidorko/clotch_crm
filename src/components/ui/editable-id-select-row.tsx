"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EditableIdSelectOption {
  id: string;
  label: string;
}

interface EditableIdSelectRowProps {
  label: string;
  value: string;
  options: EditableIdSelectOption[];
  onChange: (id: string) => void;
  emptyLabel?: string;
}

/**
 * Той самий патерн "перегляд + олівчик", що EditableSelectRow, але значення —
 * id, не сам відображуваний текст (SelectValue отримує render-функцію, як і
 * SupplierSelectRow/CategoriesTab, ui-kit.md) — для полів, де варіанти
 * приходять з реального довідника (id/label), не з фіксованого списку рядків.
 */
export function EditableIdSelectRow({
  label,
  value,
  options,
  onChange,
  emptyLabel = "—",
}: EditableIdSelectRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectedLabel = options.find((option) => option.id === value)?.label ?? emptyLabel;

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      {isEditing ? (
        <Select
          value={value}
          defaultOpen
          onValueChange={(v) => {
            if (v) onChange(v);
          }}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false);
          }}
        >
          <SelectTrigger className="min-w-0 flex-1 justify-between">
            <SelectValue className="truncate">
              {(v: string) => options.find((option) => option.id === v)?.label ?? emptyLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {options.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Немає варіантів</div>
            ) : (
              options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-foreground">{selectedLabel}</span>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Редагувати ${label}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
