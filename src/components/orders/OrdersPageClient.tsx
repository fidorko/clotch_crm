"use client";

import { useState } from "react";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { exportOrdersToCsv } from "@/lib/orders/export-csv";
import { DEV_USER } from "@/lib/constants/dev-user";
import { printOrdersDocumentsAction, type PrintOrdersDocumentsResult } from "@/app/orders/actions";
import type { OrderListItem, OrderStatus, PostPrintAction } from "@/lib/types/orders";
import { OrdersHeader } from "./OrdersHeader";
import { OrdersKpiCards } from "./OrdersKpiCards";
import { OrdersTable } from "./OrdersTable";

const DEFAULT_POST_PRINT_ACTION: PostPrintAction = {
  none: false,
  changeStatus: true,
  status: "shipped",
  notify: false,
  notifyUser: DEV_USER.name,
};

// Оркестратор — тримає мок-замовлення й виділення в стані, щоб «Змінити
// статус»/«Експорт»/«Друк ТТН» у OrdersHeader (окремий сусід OrdersTable у
// дереві) бачили те саме виділення. «Змінити статус» і «Дія після друку»
// реально мутують мок-масив у пам'яті (не персистуються, скидаються при
// перезавантаженні — чесно, це демонстрація, не реальний бек), «Експорт» —
// справжній CSV-файл у браузер.
export function OrdersPageClient({
  orders: initialOrders,
  paymentStatusOptions,
}: {
  orders: OrderListItem[];
  paymentStatusOptions: string[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [postPrintAction, setPostPrintAction] = useState<PostPrintAction>(DEFAULT_POST_PRINT_ACTION);
  const dev = DEV_BLOCK_LABELS.orders;

  const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));

  function handleChangeStatus(status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, status } : o)));
    setSelectedIds([]);
  }

  function handleExportSelected() {
    exportOrdersToCsv(selectedOrders);
  }

  // Реальний друк маркування Нової пошти (printOrdersDocumentsAction,
  // п'ятий прохід, пряма вказівка людини) — той самий provider.printDocuments,
  // що /orders/new. «Дія після друку» застосовується лише до замовлень, для
  // яких реально сформувався URL друку (не до пропущених — без ЕН/ключа).
  // Попап лишається відкритим (закриває людина хрестиком) — виділення
  // чиститься саме там, не тут.
  async function handlePrintTtn(orderIds: string[]): Promise<PrintOrdersDocumentsResult> {
    const result = await printOrdersDocumentsAction(orderIds, "marking");
    const printedIds = orderIds.filter((id) => !result.skipped.some((s) => s.orderId === id));
    if (postPrintAction.changeStatus && printedIds.length > 0) {
      setOrders((prev) =>
        prev.map((o) => (printedIds.includes(o.id) ? { ...o, status: postPrintAction.status } : o))
      );
    }
    // "notify" — конфігурація без реальної розсилки, нема системи сповіщень.
    return result;
  }

  return (
    <div className="flex flex-1 flex-col">
      <DevBlockLabel name="OrdersHeader" enabled={dev}>
        <OrdersHeader
          total={orders.length}
          selectedCount={selectedIds.length}
          selectedOrders={selectedOrders}
          onChangeStatus={handleChangeStatus}
          onExportSelected={handleExportSelected}
          onClearSelection={() => setSelectedIds([])}
          postPrintAction={postPrintAction}
          onPostPrintActionChange={setPostPrintAction}
          onPrintTtn={handlePrintTtn}
        />
      </DevBlockLabel>

      <DevBlockLabel name="OrdersPage" enabled={dev}>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <OrdersKpiCards orders={orders} />
          <OrdersTable
            orders={orders}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            paymentStatusOptions={paymentStatusOptions}
          />
        </div>
      </DevBlockLabel>
    </div>
  );
}
