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

interface EditableSelectRowProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

/**
 * Той самий патерн "перегляд + олівчик → редагування", що й PurchasePriceRow,
 * але для випадаючого списку замість текстового поля: до кліку на олівчик —
 * просто текст, після — Select одразу відкритий (defaultOpen), закриття без
 * вибору (Escape/клік повз) повертає в режим перегляду без зміни значення.
 */
export function EditableSelectRow({ label, value, options, onChange }: EditableSelectRowProps) {
  const [isEditing, setIsEditing] = useState(false);

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
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent align="start">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-foreground">{value}</span>
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
