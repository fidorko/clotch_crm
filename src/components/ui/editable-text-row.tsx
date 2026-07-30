"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Той самий патерн "перегляд + олівчик → редагування", що й EditableSelectRow, але для тексту. */
export function EditableTextRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    setIsEditing(false);
    if (draft !== value) onChange(draft);
  }

  return (
    <div className="flex items-center gap-4 py-1.5">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      {isEditing ? (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(value);
              setIsEditing(false);
            }
          }}
          placeholder={placeholder}
          className="h-7 flex-1 px-2 text-sm"
        />
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-foreground">{value || "—"}</span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setIsEditing(true);
            }}
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
