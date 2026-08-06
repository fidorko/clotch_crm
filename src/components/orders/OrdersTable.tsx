"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseUaDate } from "@/lib/date-ua";
import type { OrderListItem } from "@/lib/types/orders";
import { OrderRow } from "./OrderRow";
import { OrdersFiltersBar, type OrdersFilters } from "./OrdersFiltersBar";

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500, 1000];

const EMPTY_FILTERS: OrdersFilters = {
  search: "",
  status: "all",
  paymentStatus: "all",
  source: "all",
  dateFrom: "",
  dateTo: "",
};

export function OrdersTable({
  orders,
  selectedIds,
  onSelectedIdsChange,
  paymentStatusOptions,
}: {
  orders: OrderListItem[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  paymentStatusOptions: string[];
}) {
  const [filters, setFilters] = useState<OrdersFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  function handleFiltersChange(patch: Partial<OrdersFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const from = filters.dateFrom.length === 10 ? parseUaDate(filters.dateFrom) : null;
    const to = filters.dateTo.length === 10 ? parseUaDate(filters.dateTo) : null;

    return orders.filter((order) => {
      if (filters.status !== "all" && order.status !== filters.status) return false;
      if (filters.paymentStatus !== "all" && order.paymentStatus?.name !== filters.paymentStatus) return false;
      if (filters.source !== "all" && order.source !== filters.source) return false;

      if (search) {
        const haystack = `${order.number} ${order.customer.name} ${order.customer.phone}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      const orderDate = parseUaDate(order.createdAt);
      if (from && orderDate && orderDate < from) return false;
      if (to && orderDate && orderDate > to) return false;

      return true;
    });
  }, [orders, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  const allPageSelected = pageItems.length > 0 && pageItems.every((o) => selectedIds.includes(o.id));

  function toggleSelect(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      onSelectedIdsChange(selectedIds.filter((id) => !pageItems.some((o) => o.id === id)));
    } else {
      const pageIds = pageItems.map((o) => o.id);
      onSelectedIdsChange([...selectedIds, ...pageIds.filter((id) => !selectedIds.includes(id))]);
    }
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y divide-border px-0">
        <OrdersFiltersBar filters={filters} onChange={handleFiltersChange} paymentStatusOptions={paymentStatusOptions} />

        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "замовлення" : "замовлень"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Відображати по</span>
            <Select value={String(pageSize)} onValueChange={(v) => v && handlePageSizeChange(v)}>
              <SelectTrigger size="sm" className="w-20">
                <SelectValue>{() => String(pageSize)}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAllOnPage}
                  aria-label="Обрати всі замовлення на сторінці"
                />
              </TableHead>
              <TableHead>Замовлення</TableHead>
              <TableHead>Клієнт</TableHead>
              <TableHead>Товари</TableHead>
              <TableHead>Сума</TableHead>
              <TableHead>Оплата</TableHead>
              <TableHead>Доставка</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Менеджер</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                selected={selectedIds.includes(order.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
            {pageItems.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                  {orders.length === 0 ? "Ще немає жодного замовлення" : "Нічого не знайдено"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end gap-2 p-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            стор. {currentPage}/{pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Далі
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
