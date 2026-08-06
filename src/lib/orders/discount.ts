import type { OrderDiscountTypeValue } from "@/server/data/orders";

/** Знижка (%/сума) застосована до бази, не менше нуля — спільна для рядка товару, підсумку й форми (3 використання, ui-kit.md правило 9.2). */
export function applyDiscount(base: number, type: OrderDiscountTypeValue | null, value: string | number | null): number {
  const numValue = typeof value === "string" ? Number(value) || 0 : (value ?? 0);
  if (!type || !numValue) return base;
  const discount = type === "percent" ? (base * numValue) / 100 : numValue;
  return Math.max(0, base - discount);
}
