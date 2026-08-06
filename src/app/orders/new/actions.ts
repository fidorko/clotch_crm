"use server";

import { revalidatePath } from "next/cache";
import { getCarrierProvider } from "@/server/carriers/carrier.factory";
import { payerToNpRef } from "@/server/carriers/novaposhta/mapper";
import type { CreateShipmentInput } from "@/server/carriers/carrier.interface";
import { searchCustomers, type CustomerRow } from "@/server/data/customers";
import {
  createOrder,
  getOrderById,
  saveOrderShipment,
  type OrderPaymentStatusValue,
  type OrderRow,
  type OrderSourceValue,
} from "@/server/data/orders";
import { listDeliveryMethods, type DeliveryMethodRow } from "@/server/data/delivery-methods";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DEV_USER } from "@/lib/constants/dev-user";

export async function searchCustomersAction(query: string): Promise<CustomerRow[]> {
  return searchCustomers(getDevTenantId(), query);
}

export interface OrderFormItemInput {
  productSkuId: string;
  productName: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderFormItemInput[];
  paymentMethod: string;
  paymentStatus: OrderPaymentStatusValue;
  source: OrderSourceValue;
  notes: string;
  deliveryMethodId: string;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientWarehouse: string;
  weightKg: string;
  seatsAmount: string;
  declaredValue: string;
  description: string;
  createShipmentNow: boolean;
}

export type CreateOrderResult =
  | { ok: true; order: OrderRow; shipmentError: string | null }
  | { ok: false; message: string };

/**
 * Реальний виклик InternetDocument.save (docs/carriers/novaposhta/shipments.md)
 * — окремо від createOrder: мережевий виклик до api.novaposhta.ua не повинен
 * тримати відкритою DB-транзакцію. Якщо перевізник відхилив запит — замовлення
 * лишається створеним (без ТТН), помилка повертається окремим полем, не кидає
 * весь createOrderAction.
 */
async function tryCreateShipment(
  tenantId: string,
  order: OrderRow,
  deliveryMethod: DeliveryMethodRow,
  input: OrderFormInput
): Promise<string | null> {
  if (deliveryMethod.carrierKey !== "nova_poshta") {
    return "Реальне створення ЕН підключено поки лише для Нової пошти";
  }
  if (!deliveryMethod.apiKey) return "У способу доставки не задано API-ключ";
  if (
    !deliveryMethod.senderCounterpartyRef ||
    !deliveryMethod.senderContactPersonRef ||
    !deliveryMethod.senderCityRef ||
    !deliveryMethod.senderWarehouseRef
  ) {
    return "У способу доставки не заповнено відправника (settings → Доставка)";
  }
  if (!input.recipientCityRef || !input.recipientWarehouseRef) {
    return "Оберіть місто й відділення отримувача";
  }

  const shipmentInput: CreateShipmentInput = {
    serviceType: "WarehouseWarehouse",
    payerType: payerToNpRef(deliveryMethod.payer),
    paymentMethod: "Cash",
    cargoType: "Parcel",
    weightKg: Number(input.weightKg) || 0.5,
    seatsAmount: Number(input.seatsAmount) || 1,
    description: input.description || `Замовлення ${order.number}`,
    declaredValue: Number(input.declaredValue) || Number(order.totalSum),
    sender: {
      kind: "counterparty",
      cityRef: deliveryMethod.senderCityRef,
      warehouseRef: deliveryMethod.senderWarehouseRef,
      counterpartyRef: deliveryMethod.senderCounterpartyRef,
      contactPersonRef: deliveryMethod.senderContactPersonRef,
      phone: deliveryMethod.senderPhone ?? "",
    },
    recipient: {
      kind: "new_recipient",
      cityRef: input.recipientCityRef,
      cityName: input.recipientCity,
      warehouseRef: input.recipientWarehouseRef,
      fullName: input.recipientName,
      phone: input.recipientPhone,
    },
  };

  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, deliveryMethod.apiKey);
    const result = await provider.createShipment(shipmentInput);
    await saveOrderShipment(tenantId, order.id, {
      ttn: result.documentNumber,
      carrierShipmentRef: result.ref,
      costOnSite: result.costOnSite,
      estimatedDeliveryDate: result.estimatedDeliveryDate,
    });
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Не вдалося створити ЕН Нової пошти";
  }
}

export async function createOrderAction(input: OrderFormInput): Promise<CreateOrderResult> {
  const tenantId = getDevTenantId();

  const name = input.customerName.trim();
  const phone = input.customerPhone.trim();
  if (!name) return { ok: false, message: "Вкажіть ім'я клієнта" };
  if (phone.replace(/\D/g, "").length < 12) return { ok: false, message: "Вкажіть коректний телефон клієнта" };
  if (input.items.length === 0) return { ok: false, message: "Додайте хоча б одну позицію товару" };

  let order: OrderRow;
  try {
    ({ order } = await createOrder(tenantId, {
      customer: { name, phone, email: input.customerEmail.trim() || null },
      paymentMethod: input.paymentMethod || null,
      paymentStatus: input.paymentStatus,
      source: input.source,
      managerName: DEV_USER.name, // TODO(auth) — той самий підхід, що менеджер у мок-списку /orders
      notes: input.notes.trim() || null,
      deliveryMethodId: input.deliveryMethodId || null,
      recipientName: input.recipientName.trim() || null,
      recipientPhone: input.recipientPhone.trim() || null,
      recipientCityRef: input.recipientCityRef || null,
      recipientCity: input.recipientCity || null,
      recipientWarehouseRef: input.recipientWarehouseRef || null,
      recipientWarehouse: input.recipientWarehouse || null,
      items: input.items.map((item) => ({ ...item, productSkuId: item.productSkuId || null })),
    }));
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося створити замовлення" };
  }

  let shipmentError: string | null = null;
  if (input.createShipmentNow && input.deliveryMethodId) {
    const methods = await listDeliveryMethods(tenantId);
    const deliveryMethod = methods.find((m) => m.id === input.deliveryMethodId);
    shipmentError = deliveryMethod
      ? await tryCreateShipment(tenantId, order, deliveryMethod, input)
      : "Спосіб доставки не знайдено";
    if (!shipmentError) {
      order = (await getOrderById(tenantId, order.id)) ?? order;
    }
  }

  revalidatePath("/orders");
  return { ok: true, order, shipmentError };
}
