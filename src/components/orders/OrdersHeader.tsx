import { Download, Plus, Printer, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { PrintTtnDialog } from "@/components/orders/PrintTtnDialog";
import {
  ORDER_STATUS_META,
  ORDER_STATUS_ORDER,
  type OrderListItem,
  type OrderStatus,
  type PostPrintAction,
} from "@/lib/types/orders";

export function OrdersHeader({
  total,
  selectedCount,
  selectedOrders,
  onChangeStatus,
  onExportSelected,
  onClearSelection,
  postPrintAction,
  onPostPrintActionChange,
  onPrintTtn,
}: {
  total: number;
  selectedCount: number;
  selectedOrders: OrderListItem[];
  onChangeStatus: (status: OrderStatus) => void;
  onExportSelected: () => void;
  onClearSelection: () => void;
  postPrintAction: PostPrintAction;
  onPostPrintActionChange: (action: PostPrintAction) => void;
  onPrintTtn: (orderIds: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-foreground">Замовлення</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Замовлення</h1>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "замовлення" : "замовлень"}
          </span>
        </div>

        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedCount} обрано</span>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <RefreshCcw className="size-3.5" />
                Змінити статус
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Новий статус</DropdownMenuLabel>
                  {ORDER_STATUS_ORDER.map((status) => (
                    <DropdownMenuItem key={status} onClick={() => onChangeStatus(status)}>
                      {ORDER_STATUS_META[status].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <PrintTtnDialog
              selectedOrders={selectedOrders}
              postPrintAction={postPrintAction}
              onPostPrintActionChange={onPostPrintActionChange}
              onPrint={onPrintTtn}
              onClose={onClearSelection}
              trigger={
                <Button variant="outline" size="sm">
                  <Printer className="size-3.5" />
                  Друк ТТН
                </Button>
              }
            />
            <Button variant="outline" size="sm" onClick={onExportSelected}>
              <Download className="size-3.5" />
              Експорт
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClearSelection} aria-label="Скасувати вибір">
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <Button disabled title="Форма створення замовлення — наступний крок (список поки на моках)">
            <Plus className="size-4" />
            Створити замовлення
          </Button>
        )}
      </div>
    </div>
  );
}
