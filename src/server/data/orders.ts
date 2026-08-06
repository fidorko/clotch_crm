import { and, count, eq } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import { orderItems, orders } from "@/server/db/schema";
import { createOrGetCustomer } from "./customers";

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderStatusValue = OrderRow["status"];
export type OrderPaymentStatusValue = OrderRow["paymentStatus"];
export type OrderSourceValue = OrderRow["source"];

export interface CreateOrderItemInput {
  productSkuId: string | null;
  productName: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  customer: { name: string; phone: string; email: string | null };
  paymentMethod: string | null;
  paymentStatus: OrderPaymentStatusValue;
  source: OrderSourceValue;
  managerName: string | null;
  notes: string | null;
  deliveryMethodId: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientCityRef: string | null;
  recipientCity: string | null;
  recipientWarehouseRef: string | null;
  recipientWarehouse: string | null;
  items: CreateOrderItemInput[];
}

/** ORD-0001, ORD-0002... — той самий підхід, що generateWarehouseCode (server/data/warehouses.ts). */
async function generateOrderNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string
): Promise<string> {
  const [row] = await tx.select({ total: count() }).from(orders).where(eq(orders.tenantId, tenantId));
  const next = (row?.total ?? 0) + 1;
  return `ORD-${String(next).padStart(4, "0")}`;
}

export async function createOrder(
  tenantId: string,
  input: CreateOrderInput
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  if (input.items.length === 0) {
    throw new Error("Замовлення повинно містити хоча б одну позицію");
  }

  return withTenant(tenantId, async (tx) => {
    const customer = await createOrGetCustomer(tx, tenantId, input.customer);
    const number = await generateOrderNumber(tx, tenantId);
    const totalSum = input.items
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      .toFixed(2);

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId,
        number,
        customerId: customer.id,
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        source: input.source,
        managerName: input.managerName,
        notes: input.notes,
        totalSum,
        deliveryMethodId: input.deliveryMethodId,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        recipientCityRef: input.recipientCityRef,
        recipientCity: input.recipientCity,
        recipientWarehouseRef: input.recipientWarehouseRef,
        recipientWarehouse: input.recipientWarehouse,
      })
      .returning();

    const items = await tx
      .insert(orderItems)
      .values(
        input.items.map((item) => ({
          tenantId,
          orderId: order.id,
          productSkuId: item.productSkuId,
          productName: item.productName,
          sku: item.sku,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: (item.unitPrice * item.quantity).toFixed(2),
        }))
      )
      .returning();

    return { order, items };
  });
}

/** Записує результат реального InternetDocument.save після успішного виклику carrier API (окремо від createOrder — мережевий виклик не повинен тримати DB-транзакцію відкритою). */
export async function saveOrderShipment(
  tenantId: string,
  orderId: string,
  shipment: { ttn: string; carrierShipmentRef: string; costOnSite: number | null; estimatedDeliveryDate: string | null }
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(orders)
      .set({
        ttn: shipment.ttn,
        carrierShipmentRef: shipment.carrierShipmentRef,
        carrierCostOnSite: shipment.costOnSite !== null ? shipment.costOnSite.toFixed(2) : null,
        carrierEstimatedDeliveryDate: shipment.estimatedDeliveryDate,
        status: "shipped",
        updatedAt: new Date(),
      })
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, orderId)));
  });
}

export async function getOrderById(tenantId: string, id: string): Promise<OrderRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)))
      .limit(1);
    return row ?? null;
  });
}
