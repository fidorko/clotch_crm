import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, withTenant } from "@/server/db/client";
import {
  companyLegalEntities,
  customers,
  deliveryMethods,
  orderItems,
  orders,
  paymentMethods,
  paymentStatuses,
  warehouses,
} from "@/server/db/schema";
import { buildShipmentDescription, type ShipmentDescriptionContent } from "@/lib/orders/shipment-description";
import { formatDateUa } from "@/lib/date-ua";
import { formatRelativeUa } from "@/lib/orders/relative-time";
import type { DeliveryMethod as CarrierKeyValue, OrderListItem } from "@/lib/types/orders";
import { createOrGetCustomer } from "./customers";

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderStatusValue = OrderRow["status"];
export type OrderSourceValue = OrderRow["source"];
export type OrderDiscountTypeValue = NonNullable<OrderRow["discountType"]>;

export interface CreateOrderItemInput {
  productSkuId: string | null;
  productName: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  discountType: OrderDiscountTypeValue | null;
  discountValue: number | null;
}

export interface CreateOrderInput {
  customer: { name: string; phone: string; email: string | null; comment: string | null };
  legalEntityId: string;
  paymentMethodId: string | null;
  paymentStatusId: string;
  source: OrderSourceValue;
  managerName: string | null;
  createdByName: string | null;
  notes: string | null;
  itemsNote: string | null;
  orderDate: string;
  expectedShipmentDate: string;
  discountType: OrderDiscountTypeValue | null;
  discountValue: number | null;
  promoCode: string | null;
  warehouseId: string | null;
  usePackaging: boolean;
  packagingRef: string | null;
  packagingName: string | null;
  weightKg: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  seatsAmount: number;
  declaredValue: number | null;
  // Опис вантажу рахується тут із карток товару (itemsWithTotals нижче), не
  // приймається готовим текстом (§6 CLAUDE.md, третій прохід редизайну).
  // null — немає обраного способу доставки/налаштувань → shipmentDescription лишається null.
  shipmentDescriptionContent: ShipmentDescriptionContent | null;
  shipmentDescriptionIncludeQuantity: boolean;
  // Обрана людиною сума часткової оплати (payment_method_partial_amounts.amount
  // або ручний ввід) — потрібна лише для формули codAmount нижче, не своя колонка.
  partialAmount: number | null;
  deliveryCost: number | null;
  deliveryMethodId: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientCityRef: string | null;
  recipientCity: string | null;
  recipientWarehouseRef: string | null;
  recipientWarehouse: string | null;
  recipientStreetRef: string | null;
  recipientStreet: string | null;
  recipientHouseNumber: string | null;
  // ЕН (якщо створена ДО сабміту — createShipmentNowAction, четвертий прохід)
  // — просто записується разом із замовленням, createOrder більше не робить
  // сам виклик carrier API.
  shipmentTtn: string | null;
  shipmentRef: string | null;
  shipmentCostOnSite: number | null;
  shipmentEstimatedDeliveryDate: string | null;
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

/** Знижка (%/сума) застосована до бази, не менше нуля — той самий принцип, що PriceModeRow. */
function applyDiscount(base: number, type: OrderDiscountTypeValue | null, value: number | null): number {
  if (!type || !value) return base;
  const discount = type === "percent" ? (base * value) / 100 : value;
  return Math.max(0, base - discount);
}

/**
 * «Сума післяплати» / «До оплати клієнтом» — рахується сервером за kind
 * способу оплати (не довіряти клієнту, розділ 6 CLAUDE.md). **Четвертий
 * прохід** — реально надсилається в `createShipment` (`BackwardDeliveryData`,
 * `createShipmentNowAction`, `app/orders/new/actions.ts`), більше не лише
 * для показу.
 */
export function computeCodAmount(kind: string | null, orderTotal: number, partialAmount: number | null): number {
  if (kind === "cash_on_delivery") return orderTotal;
  if (kind === "partial_payment") return Math.max(0, orderTotal - (partialAmount ?? 0));
  return 0;
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

    let paymentMethodName: string | null = null;
    let paymentMethodKind: string | null = null;
    if (input.paymentMethodId) {
      const [method] = await tx
        .select({ name: paymentMethods.name, kind: paymentMethods.kind })
        .from(paymentMethods)
        .where(and(eq(paymentMethods.tenantId, tenantId), eq(paymentMethods.id, input.paymentMethodId)))
        .limit(1);
      paymentMethodName = method?.name ?? null;
      paymentMethodKind = method?.kind ?? null;
    }

    const itemsWithTotals = input.items.map((item) => {
      const lineBase = item.unitPrice * item.quantity;
      const lineTotal = applyDiscount(lineBase, item.discountType, item.discountValue);
      return { ...item, lineTotal };
    });
    const itemsTotal = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipmentDescription = input.shipmentDescriptionContent
      ? buildShipmentDescription(
          input.shipmentDescriptionContent,
          input.shipmentDescriptionIncludeQuantity,
          itemsWithTotals.map((item) => ({ productName: item.productName, sku: item.sku, quantity: item.quantity })),
          number
        )
      : null;
    const afterOrderDiscount = applyDiscount(itemsTotal, input.discountType, input.discountValue);
    const totalSum = afterOrderDiscount + (input.deliveryCost ?? 0);
    const codAmount = computeCodAmount(paymentMethodKind, totalSum, input.partialAmount);
    // ЕН уже реально створена (createShipmentNowAction, четвертий прохід) —
    // статус одразу "shipped", незалежно від способу оплати. Інакше — та сама
    // логіка, що раніше: оплата при отриманні готує до комплектації, передоплата
    // лишається на дефолтному "new".
    const status: OrderStatusValue = input.shipmentTtn
      ? "shipped"
      : paymentMethodKind === "cash_on_delivery"
        ? "processing"
        : "new";

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId,
        number,
        customerId: customer.id,
        legalEntityId: input.legalEntityId,
        status,
        paymentStatusId: input.paymentStatusId,
        paymentMethod: paymentMethodName,
        paymentMethodId: input.paymentMethodId,
        source: input.source,
        managerName: input.managerName,
        createdByName: input.createdByName,
        totalSum: totalSum.toFixed(2),
        notes: input.notes,
        itemsNote: input.itemsNote,
        orderDate: input.orderDate,
        expectedShipmentDate: input.expectedShipmentDate,
        discountType: input.discountType,
        discountValue: input.discountValue !== null ? input.discountValue.toFixed(2) : null,
        promoCode: input.promoCode,
        warehouseId: input.warehouseId,
        usePackaging: input.usePackaging,
        packagingRef: input.packagingRef,
        packagingName: input.packagingName,
        weightKg: input.weightKg !== null ? input.weightKg.toFixed(2) : null,
        packageLengthCm: input.packageLengthCm,
        packageWidthCm: input.packageWidthCm,
        packageHeightCm: input.packageHeightCm,
        seatsAmount: input.seatsAmount,
        declaredValue: input.declaredValue !== null ? input.declaredValue.toFixed(2) : null,
        shipmentDescription,
        codAmount: codAmount.toFixed(2),
        deliveryCost: input.deliveryCost !== null ? input.deliveryCost.toFixed(2) : null,
        deliveryMethodId: input.deliveryMethodId,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        recipientCityRef: input.recipientCityRef,
        recipientCity: input.recipientCity,
        recipientWarehouseRef: input.recipientWarehouseRef,
        recipientWarehouse: input.recipientWarehouse,
        recipientStreetRef: input.recipientStreetRef,
        recipientStreet: input.recipientStreet,
        recipientHouseNumber: input.recipientHouseNumber,
        ttn: input.shipmentTtn,
        carrierShipmentRef: input.shipmentRef,
        carrierCostOnSite: input.shipmentCostOnSite !== null ? input.shipmentCostOnSite.toFixed(2) : null,
        carrierEstimatedDeliveryDate: input.shipmentEstimatedDeliveryDate,
      })
      .returning();

    const items = await tx
      .insert(orderItems)
      .values(
        itemsWithTotals.map((item) => ({
          tenantId,
          orderId: order.id,
          productSkuId: item.productSkuId,
          productName: item.productName,
          sku: item.sku,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          discountType: item.discountType,
          discountValue: item.discountValue !== null ? item.discountValue.toFixed(2) : null,
          lineTotal: item.lineTotal.toFixed(2),
        }))
      )
      .returning();

    return { order, items };
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

export interface OrderDetail {
  order: OrderRow;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  paymentStatusName: string | null;
  paymentStatusColor: string | null;
  deliveryMethodName: string | null;
  legalEntityName: string | null;
  items: OrderItemRow[];
}

/** Картка перегляду замовлення (/orders/[id], четвертий прохід — раніше номер у списку нікуди не вів). */
export async function getOrderDetail(tenantId: string, id: string): Promise<OrderDetail | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({
        order: orders,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        paymentStatusName: paymentStatuses.name,
        paymentStatusColor: paymentStatuses.color,
        deliveryMethodName: deliveryMethods.name,
        legalEntityName: companyLegalEntities.name,
      })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .leftJoin(paymentStatuses, eq(paymentStatuses.id, orders.paymentStatusId))
      .leftJoin(deliveryMethods, eq(deliveryMethods.id, orders.deliveryMethodId))
      .leftJoin(companyLegalEntities, eq(companyLegalEntities.id, orders.legalEntityId))
      .where(and(eq(orders.tenantId, tenantId), eq(orders.id, id)))
      .limit(1);
    if (!row) return null;

    const items = await tx
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.tenantId, tenantId), eq(orderItems.orderId, id)));

    return {
      order: row.order,
      customerName: row.customerName ?? "—",
      customerPhone: row.customerPhone ?? "",
      customerEmail: row.customerEmail,
      paymentStatusName: row.paymentStatusName,
      paymentStatusColor: row.paymentStatusColor,
      deliveryMethodName: row.deliveryMethodName,
      legalEntityName: row.legalEntityName,
      items,
    };
  });
}

// carrierKey реального delivery_methods (server/carriers/) → фіксований набір
// lib/types/orders.ts.DeliveryMethod, потрібен лише для групування "Друк ТТН"
// (PrintTtnDialog, orders.md) за лого перевізника — тенант-довільні способи
// (напр. "meest_express") просто не потрапляють у жодну групу.
const KNOWN_CARRIER_KEYS = new Set<CarrierKeyValue>(["nova_poshta", "ukrposhta", "courier", "pickup"]);

// Список замовлень (/orders, четвертий прохід — реальні дані замість мок-
// генератора). LIMIT — правило "На списках завжди LIMIT" (CLAUDE.md §7);
// подальша пагінація/фільтри — клієнтські (OrdersTable.tsx, той самий підхід,
// що раніше з мок-масивом).
const ORDERS_LIST_LIMIT = 1000;

export async function listOrdersForList(tenantId: string): Promise<OrderListItem[]> {
  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: orders.id,
        number: orders.number,
        createdAt: orders.createdAt,
        totalSum: orders.totalSum,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        ttn: orders.ttn,
        recipientCity: orders.recipientCity,
        source: orders.source,
        managerName: orders.managerName,
        customerName: customers.name,
        customerPhone: customers.phone,
        paymentStatusName: paymentStatuses.name,
        paymentStatusColor: paymentStatuses.color,
        deliveryMethodName: deliveryMethods.name,
        carrierKey: deliveryMethods.carrierKey,
        warehouseName: warehouses.name,
      })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .leftJoin(paymentStatuses, eq(paymentStatuses.id, orders.paymentStatusId))
      .leftJoin(deliveryMethods, eq(deliveryMethods.id, orders.deliveryMethodId))
      .leftJoin(warehouses, eq(warehouses.id, orders.warehouseId))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(ORDERS_LIST_LIMIT);

    const orderIds = rows.map((r) => r.id);
    const itemRows =
      orderIds.length === 0
        ? []
        : await tx
            .select({ orderId: orderItems.orderId, productName: orderItems.productName, quantity: orderItems.quantity })
            .from(orderItems)
            .where(and(eq(orderItems.tenantId, tenantId), inArray(orderItems.orderId, orderIds)));

    const itemsByOrder = new Map<string, { productName: string; quantity: number }[]>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push({ productName: item.productName, quantity: item.quantity });
      itemsByOrder.set(item.orderId, list);
    }

    const now = Date.now();
    return rows.map((row): OrderListItem => {
      const items = itemsByOrder.get(row.id) ?? [];
      const minutesAgo = Math.max(0, Math.round((now - row.createdAt.getTime()) / 60000));
      return {
        id: row.id,
        number: row.number,
        createdAt: formatDateUa(row.createdAt) ?? "",
        createdAtRelative: formatRelativeUa(minutesAgo),
        customer: { name: row.customerName ?? "—", phone: row.customerPhone ?? "", isReturning: false },
        itemsSummary: items[0]?.productName ?? "—",
        itemsCount: items.length,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        totalSum: Number(row.totalSum),
        status: row.status,
        paymentStatus: row.paymentStatusName ? { name: row.paymentStatusName, color: row.paymentStatusColor ?? "#94A3B8" } : null,
        paymentMethod: row.paymentMethod ?? "—",
        deliveryMethod: row.deliveryMethodName ? { name: row.deliveryMethodName } : null,
        carrierKey: KNOWN_CARRIER_KEYS.has(row.carrierKey as CarrierKeyValue) ? (row.carrierKey as CarrierKeyValue) : null,
        ttn: row.ttn,
        city: row.recipientCity ?? "—",
        warehouse: row.warehouseName,
        source: row.source,
        manager: row.managerName ?? "—",
      };
    });
  });
}
