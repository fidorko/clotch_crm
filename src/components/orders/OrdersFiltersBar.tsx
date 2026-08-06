import { Search } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_SOURCE_LABEL, ORDER_STATUS_META, ORDER_STATUS_ORDER, type OrderSource, type OrderStatus } from "@/lib/types/orders";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Усі статуси" },
  ...ORDER_STATUS_ORDER.map((s) => ({ value: s, label: ORDER_STATUS_META[s].label })),
];

const SOURCE_OPTIONS: { value: OrderSource | "all"; label: string }[] = [
  { value: "all", label: "Усі канали" },
  ...(Object.entries(ORDER_SOURCE_LABEL) as [OrderSource, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

export interface OrdersFilters {
  search: string;
  status: OrderStatus | "all";
  paymentStatus: string; // "all" | реальна назва payment_statuses.name
  source: OrderSource | "all";
  dateFrom: string;
  dateTo: string;
}

export function OrdersFiltersBar({
  filters,
  onChange,
  paymentStatusOptions,
}: {
  filters: OrdersFilters;
  onChange: (patch: Partial<OrdersFilters>) => void;
  // Реальні тенант-керовані статуси оплат (payment_statuses), не фіксований
  // enum — четвертий прохід, /orders тепер читає реальні замовлення.
  paymentStatusOptions: string[];
}) {
  const paymentOptions = ["all", ...paymentStatusOptions];
  return (
    <div className="flex flex-wrap items-end gap-3 p-4">
      <div className="flex min-w-72 flex-1 flex-col gap-1.5">
        <FieldLabel>Пошук</FieldLabel>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Номер, клієнт, телефон..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Дата від</FieldLabel>
        <DatePicker value={filters.dateFrom} onChange={(v) => onChange({ dateFrom: v })} placeholder="Будь-яка" className="w-36" />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Дата до</FieldLabel>
        <DatePicker value={filters.dateTo} onChange={(v) => onChange({ dateTo: v })} placeholder="Будь-яка" className="w-36" />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Статус</FieldLabel>
        <Select
          value={filters.status}
          onValueChange={(v) => v && onChange({ status: v as OrderStatus | "all" })}
        >
          <SelectTrigger className="w-44">
            <SelectValue>{(v: string) => STATUS_OPTIONS.find((o) => o.value === v)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Оплата</FieldLabel>
        <Select value={filters.paymentStatus} onValueChange={(v) => v && onChange({ paymentStatus: v })}>
          <SelectTrigger className="w-40">
            <SelectValue>{(v: string) => (v === "all" ? "Усі оплати" : v)}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {paymentOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name === "all" ? "Усі оплати" : name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Канал</FieldLabel>
        <Select
          value={filters.source}
          onValueChange={(v) => v && onChange({ source: v as OrderSource | "all" })}
        >
          <SelectTrigger className="w-36">
            <SelectValue>{(v: string) => SOURCE_OPTIONS.find((o) => o.value === v)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
