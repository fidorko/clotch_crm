import type { BinSeparator } from "@/lib/warehouse/bin-address";

export const BIN_SEPARATOR_OPTIONS: { value: BinSeparator; label: string }[] = [
  { value: "space", label: "Пробіл" },
  { value: "dash", label: "Дефіс" },
  { value: "slash", label: "Коса риска" },
  { value: "none", label: "Без роздільника" },
];
