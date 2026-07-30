"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildCategoryTree } from "@/lib/categories/tree";
import type { CategoryRow } from "@/server/data/categories";

/**
 * Спільний ієрархічний піклер категорій — той самий список (батьківська,
 * під нею відступом другорядні), що й у таблиці "Категорії товару". Другий
 * реальний use-case = винесено з CategoryForm (правило 9.2 CLAUDE.md).
 */
export function CategoryTreeSelect({
  categories,
  value,
  onChange,
  triggerClassName,
  excludeIds,
  noneOption,
  defaultOpen,
  onOpenChange,
}: {
  categories: CategoryRow[];
  value: string;
  onChange: (value: string) => void;
  triggerClassName?: string;
  excludeIds?: Set<string>;
  noneOption?: { value: string; label: string };
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const filtered = excludeIds ? categories.filter((c) => !excludeIds.has(c.id)) : categories;
  const options = buildCategoryTree(filtered, null);

  function labelFor(v: string): string {
    if (noneOption && v === noneOption.value) return noneOption.label;
    return options.find((row) => row.category.id === v)?.category.name ?? "";
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v)}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (open) => onOpenChange(open) : undefined}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue>{(v: string) => labelFor(v)}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {noneOption && <SelectItem value={noneOption.value}>{noneOption.label}</SelectItem>}
        {options.map(({ category, depth }) => (
          <SelectItem key={category.id} value={category.id}>
            {"— ".repeat(depth)}
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
