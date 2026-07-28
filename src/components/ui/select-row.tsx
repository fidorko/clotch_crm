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
  align?: "start" | "end";
}

export function SelectRow({ label, value, options, onChange, align = "end" }: SelectRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger
          size="sm"
          className="w-fit gap-1 border-transparent bg-transparent px-1.5 text-sm font-normal text-foreground shadow-none hover:border-input hover:bg-accent/50 data-[state=open]:border-input"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align={align}>
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
