import type { ProductStatus } from "@/lib/types/product";

export const PRODUCT_STATUS_OPTIONS: {
  value: ProductStatus;
  label: string;
  badgeVariant: "success" | "warning" | "secondary";
}[] = [
  { value: "active", label: "Активний", badgeVariant: "success" },
  { value: "inactive", label: "Не активний", badgeVariant: "warning" },
  { value: "archived", label: "Архівний", badgeVariant: "secondary" },
];
