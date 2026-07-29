"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectRowProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

export function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger
          size="sm"
          className="min-w-0 flex-1 justify-between gap-1 border-transparent bg-transparent px-1.5 text-sm font-normal text-foreground shadow-none hover:border-input hover:bg-accent/50 data-[state=open]:border-input"
        >
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
    </div>
  );
}
