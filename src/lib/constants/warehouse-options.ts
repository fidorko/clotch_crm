export const WAREHOUSE_TYPE_OPTIONS = [
  { value: "main", label: "Основний склад зберігання" },
  { value: "pos", label: "Точка продажу" },
  { value: "returns", label: "Склад повернень" },
  { value: "defective", label: "Склад браку" },
  { value: "disposal", label: "Склад утилізацій" },
  { value: "production", label: "Склад виробництва" },
] as const;

export type WarehouseType = (typeof WAREHOUSE_TYPE_OPTIONS)[number]["value"];
