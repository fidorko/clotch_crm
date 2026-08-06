import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";
import { formatDateUa } from "@/lib/date-ua";
import { ORDER_SOURCE_LABEL, ORDER_STATUS_META, formatOrderSum } from "@/lib/types/orders";
import { getOrderDetail } from "@/server/data/orders";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getOrderDetail(getDevTenantId(), id);
  return { title: detail ? `Замовлення ${detail.order.number}` : "Замовлення не знайдено" };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

/**
 * Перегляд замовлення (четвертий прохід — раніше номер у списку `/orders`
 * нікуди не вів, «не можу відкрити замовлення», пряма вказівка людини).
 * Read-only — редагування вже створеного замовлення не просили.
 */
export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getOrderDetail(getDevTenantId(), id);
  if (!detail) notFound();

  const { order, items } = detail;
  const dev = DEV_BLOCK_LABELS.orders;
  const statusMeta = ORDER_STATUS_META[order.status];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/orders" className="hover:text-foreground">
              Замовлення
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">{order.number}</span>
          </nav>
          <HeaderActions />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" render={<Link href="/orders" />} nativeButton={false} aria-label="Назад">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Замовлення {order.number}</h1>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      <DevBlockLabel name="OrderDetailPage" enabled={dev}>
        <div className="flex flex-col gap-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="gap-2 p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <span className="text-sm font-semibold text-foreground">Клієнт</span>
                <InfoRow label="Ім'я" value={detail.customerName} />
                <InfoRow label="Телефон" value={detail.customerPhone || "—"} />
                {detail.customerEmail && <InfoRow label="Email" value={detail.customerEmail} />}
              </CardContent>
            </Card>

            <Card className="gap-2 p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <span className="text-sm font-semibold text-foreground">Оплата</span>
                <InfoRow label="Спосіб" value={order.paymentMethod ?? "—"} />
                <InfoRow
                  label="Статус"
                  value={
                    detail.paymentStatusName ? (
                      <Badge
                        variant="outline"
                        className="border-transparent"
                        style={{
                          backgroundColor: `${detail.paymentStatusColor ?? "#94A3B8"}26`,
                          color: detail.paymentStatusColor ?? "#94A3B8",
                        }}
                      >
                        {detail.paymentStatusName}
                      </Badge>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow label="До оплати клієнтом" value={formatOrderSum(Number(order.codAmount ?? 0))} />
              </CardContent>
            </Card>

            <Card className="gap-2 p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <span className="text-sm font-semibold text-foreground">Доставка</span>
                <InfoRow label="Спосіб" value={detail.deliveryMethodName ?? "—"} />
                <InfoRow label="Місто" value={order.recipientCity ?? "—"} />
                {order.ttn && <InfoRow label="ТТН" value={order.ttn} />}
                {order.carrierCostOnSite && (
                  <InfoRow label="Вартість доставки" value={formatOrderSum(Number(order.carrierCostOnSite))} />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="gap-2 p-4">
            <CardContent className="flex flex-col gap-2 p-0">
              <span className="text-sm font-semibold text-foreground">Товари</span>
              <div className="flex flex-col divide-y divide-border">
                <div className="flex items-center gap-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <span className="min-w-0 flex-1">Товар</span>
                  <span className="w-20 shrink-0">SKU</span>
                  <span className="w-16 shrink-0 text-right">К-сть</span>
                  <span className="w-24 shrink-0 text-right">Ціна</span>
                  <span className="w-24 shrink-0 text-right">Сума</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {item.productName} <span className="text-muted-foreground">({item.color}, {item.size})</span>
                    </span>
                    <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{item.sku}</span>
                    <span className="w-16 shrink-0 text-right text-foreground">{item.quantity}</span>
                    <span className="w-24 shrink-0 text-right text-foreground">{formatOrderSum(Number(item.unitPrice))}</span>
                    <span className="w-24 shrink-0 text-right font-medium text-foreground">
                      {formatOrderSum(Number(item.lineTotal))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                <span className="text-sm font-medium text-foreground">Разом:</span>
                <span className="text-lg font-semibold text-foreground">{formatOrderSum(Number(order.totalSum))}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="gap-2 p-4">
              <CardContent className="flex flex-col gap-2 p-0">
                <span className="text-sm font-semibold text-foreground">Параметри</span>
                <InfoRow label="Юридична особа" value={detail.legalEntityName ?? "—"} />
                <InfoRow label="Джерело" value={ORDER_SOURCE_LABEL[order.source]} />
                <InfoRow label="Дата замовлення" value={formatDateUa(order.orderDate) ?? "—"} />
                <InfoRow label="Очікувана дата відвантаження" value={formatDateUa(order.expectedShipmentDate) ?? "—"} />
                {order.notes && <InfoRow label="Коментар" value={order.notes} />}
              </CardContent>
            </Card>
            {order.itemsNote && (
              <Card className="gap-2 p-4">
                <CardContent className="flex flex-col gap-2 p-0">
                  <span className="text-sm font-semibold text-foreground">Примітка до товарів</span>
                  <p className="text-sm text-foreground">{order.itemsNote}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DevBlockLabel>
    </div>
  );
}
