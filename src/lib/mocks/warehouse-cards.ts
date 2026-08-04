// Показники карток складу (SKU/комірки/заповнення/проблеми/активність) —
// у БД цих полів ще нема (тільки візуал, CLAUDE.md розділ "Крок 2"), тому
// значення детерміновано виводяться з id складу (стабільні між рендерами,
// не миготять при кожному оновленні сторінки). Статус — три стани зі
// зразка людини (Активний/Інвентаризація/Закритий), а в БД поки лише
// `isActive` (bool): якщо `false` — завжди "Закритий" (реальний сигнал),
// якщо `true` — розкид Активний/Інвентаризація для демонстрації трьох
// станів (третього стану в БД поки немає).
export type WarehouseCardStatus = "active" | "stocktaking" | "closed";

export interface WarehouseCardMock {
  status: WarehouseCardStatus;
  skuCount: number;
  cellsCount: number;
  fillPercent: number;
  problemsCount: number;
  lastActivity: string;
}

const ACTIVITY_OPTIONS = [
  "2 хв тому",
  "15 хв тому",
  "1 год тому",
  "3 год тому",
  "учора",
  "2 дні тому",
  "3 дні тому",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getWarehouseCardMock(warehouse: { id: string; isActive: boolean }): WarehouseCardMock {
  const h = hashString(warehouse.id);

  const status: WarehouseCardStatus = !warehouse.isActive
    ? "closed"
    : h % 5 === 0
      ? "stocktaking"
      : "active";

  return {
    status,
    skuCount: 800 + (h % 20000),
    cellsCount: 300 + (h % 8000),
    fillPercent: 10 + (h % 90),
    problemsCount: h % 13,
    lastActivity: ACTIVITY_OPTIONS[h % ACTIVITY_OPTIONS.length],
  };
}

export const WAREHOUSE_STATUS_META: Record<
  WarehouseCardStatus,
  { label: string; badge: "success" | "warning" | "destructive"; dot: string }
> = {
  active: { label: "Активний", badge: "success", dot: "bg-success" },
  stocktaking: { label: "Інвентаризація", badge: "warning", dot: "bg-warning" },
  closed: { label: "Закритий", badge: "destructive", dot: "bg-destructive" },
};
