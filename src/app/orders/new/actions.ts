"use server";

import { revalidatePath } from "next/cache";
import { getCarrierProvider } from "@/server/carriers/carrier.factory";
import { payerToNpRef } from "@/server/carriers/novaposhta/mapper";
import type {
  CalculateShipmentResult,
  CreateShipmentInput,
  PrintDocumentsResult,
  ShipmentResult,
  TrackShipmentResult,
} from "@/server/carriers/carrier.interface";
import { buildShipmentDescription } from "@/lib/orders/shipment-description";
import { searchCustomers, type CustomerRow } from "@/server/data/customers";
import {
  computeCodAmount,
  createOrder,
  getOrderById,
  type CreateOrderItemInput,
  type OrderDiscountTypeValue,
  type OrderRow,
  type OrderSourceValue,
} from "@/server/data/orders";
import { getPaymentMethodById } from "@/server/data/payment-methods";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import {
  listAllDeliveryMethodEntitySettings,
  type DeliveryMethodEntitySettingsRow,
} from "@/server/data/delivery-method-entity-settings";
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
  discountType: OrderDiscountTypeValue | null;
  discountValue: number | null;
}

export type NpDeliveryTypeValue = "warehouse" | "postomat" | "address";

export interface OrderFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerComment: string;
  legalEntityId: string;
  items: OrderFormItemInput[];
  paymentMethodId: string;
  paymentStatusId: string;
  partialAmount: number | null;
  source: OrderSourceValue;
  notes: string;
  itemsNote: string;
  orderDate: string;
  expectedShipmentDate: string;
  discountType: OrderDiscountTypeValue | null;
  discountValue: number | null;
  promoCode: string;
  warehouseId: string;
  usePackaging: boolean;
  packagingRef: string;
  packagingName: string;
  weightKg: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  seatsAmount: string;
  declaredValue: string;
  deliveryCost: string;
  deliveryMethodId: string;
  npType: NpDeliveryTypeValue;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientWarehouse: string;
  recipientStreetRef: string;
  recipientStreet: string;
  recipientHouseNumber: string;
  // ЕН тепер створюється одразу при кліку в OrderDeliveryCard (createShipmentNowAction,
  // четвертий прохід), не при сабміті замовлення — сюди приходить уже готовий
  // результат (порожні рядки, коли ЕН не створювали).
  shipmentTtn: string;
  shipmentRef: string;
  shipmentCostOnSite: string;
  shipmentEstimatedDeliveryDate: string;
}

export type CreateOrderResult =
  | { ok: true; order: OrderRow }
  | { ok: false; message: string };

function findEntitySettings(
  allSettings: DeliveryMethodEntitySettingsRow[],
  deliveryMethodId: string,
  legalEntityId: string
): DeliveryMethodEntitySettingsRow | undefined {
  return allSettings.find((s) => s.deliveryMethodId === deliveryMethodId && s.legalEntityId === legalEntityId);
}

/**
 * ServiceType Нової пошти — 2 половини "Warehouse"/"Doors" (відправник/
 * отримувач), звірено з офіційно задокументованими значеннями getDocumentPrice
 * (docs/carriers/novaposhta/shipments.md). Поштомат рахуємо як "Warehouse"
 * зі сторони отримувача (та сама категорія точки видачі, що відділення).
 */
function computeServiceType(senderAddressType: string, npType: NpDeliveryTypeValue): string {
  const senderPart = senderAddressType === "address" ? "Doors" : "Warehouse";
  const recipientPart = npType === "address" ? "Doors" : "Warehouse";
  return `${senderPart}${recipientPart}`;
}

export interface CreateShipmentNowInput {
  deliveryMethodId: string;
  legalEntityId: string;
  npType: NpDeliveryTypeValue;
  weightKg: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  seatsAmount: string;
  declaredValue: string;
  recipientName: string;
  recipientPhone: string;
  recipientCityRef: string;
  recipientCity: string;
  recipientWarehouseRef: string;
  recipientStreetRef: string;
  recipientHouseNumber: string;
  items: { productName: string; sku: string; quantity: number }[];
  // Для codAmount/BackwardDeliveryData (не довіряти клієнту, §6 CLAUDE.md) —
  // рахуємо тут із kind способу оплати, той самий computeCodAmount, що
  // createOrder (order ще не існує, тому kind нізвідки взяти, крім прямого
  // paymentMethodId+partialAmount+вже порахованої на клієнті grandTotal).
  paymentMethodId: string;
  partialAmount: number | null;
  grandTotal: number;
}

export type CreateShipmentNowResult =
  | { ok: true; shipment: ShipmentResult }
  | { ok: false; message: string };

/**
 * Реальний виклик InternetDocument.save (docs/carriers/novaposhta/shipments.md)
 * — четвертий прохід, пряма вказівка людини: ЕН створюється ОДРАЗУ по кліку
 * «Створити ЕН» у OrderDeliveryCard, ДО збереження самого замовлення (раніше
 * було навпаки — при сабміті форми). Номер ЕН/вартість повертаються клієнту й
 * зберігаються разом із замовленням лише при фінальному сабміті
 * (createOrderAction нижче, поля shipmentTtn/shipmentRef/...).
 */
export async function createShipmentNowAction(input: CreateShipmentNowInput): Promise<CreateShipmentNowResult> {
  const tenantId = getDevTenantId();
  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === input.deliveryMethodId);
  if (!deliveryMethod) return { ok: false, message: "Спосіб доставки не знайдено" };
  if (deliveryMethod.carrierKey !== "nova_poshta") {
    return { ok: false, message: "Реальне створення ЕН підключено поки лише для Нової пошти" };
  }
  const entitySettings = findEntitySettings(allEntitySettings, input.deliveryMethodId, input.legalEntityId);
  if (!entitySettings) return { ok: false, message: "У обраної юридичної особи немає налаштованої доставки цим способом (Налаштування → Доставка)" };
  if (!entitySettings.apiKey) return { ok: false, message: "У способу доставки не задано API-ключ (Налаштування → Доставка)" };
  if (
    !entitySettings.senderCounterpartyRef ||
    !entitySettings.senderContactPersonRef ||
    !entitySettings.senderCityRef ||
    !entitySettings.senderWarehouseRef
  ) {
    return { ok: false, message: "У способу доставки не заповнено відправника (settings → Доставка)" };
  }
  if (!input.recipientCityRef) return { ok: false, message: "Оберіть місто отримувача" };
  if (input.npType === "address" ? !input.recipientStreetRef || !input.recipientHouseNumber : !input.recipientWarehouseRef) {
    return {
      ok: false,
      message: input.npType === "address" ? "Оберіть вулицю й номер будинку отримувача" : "Оберіть відділення/поштомат отримувача",
    };
  }

  // Опис вантажу — реально з налаштувань способу доставки + карток товару
  // (§6 CLAUDE.md, восьмий пункт четвертого проходу — раніше рахувався лише
  // при сабміті замовлення й ніколи фактично не потрапляв у save(), бо
  // tryCreateShipment викликався ще до того). orderNumber невідомий (замовлення
  // ще не створене) — для descriptionContent="order_id" це відома межа.
  const description = buildShipmentDescription(
    entitySettings.descriptionContent,
    entitySettings.descriptionIncludeQuantity,
    input.items,
    null
  );

  const paymentMethod = input.paymentMethodId ? await getPaymentMethodById(tenantId, input.paymentMethodId) : null;
  const codAmount = computeCodAmount(paymentMethod?.kind ?? null, input.grandTotal, input.partialAmount);

  const shipmentInput: CreateShipmentInput = {
    serviceType: computeServiceType(entitySettings.senderAddressType, input.npType),
    payerType: payerToNpRef(entitySettings.payer),
    paymentMethod: "Cash",
    cargoType: "Parcel",
    weightKg: Number(input.weightKg) || 0.5,
    seatsAmount: Number(input.seatsAmount) || 1,
    packageLengthCm: Number(input.packageLengthCm) || undefined,
    packageWidthCm: Number(input.packageWidthCm) || undefined,
    packageHeightCm: Number(input.packageHeightCm) || undefined,
    description: description || "Замовлення",
    declaredValue: Number(input.declaredValue) || 0,
    codAmount,
    sender: {
      kind: "counterparty",
      cityRef: entitySettings.senderCityRef,
      warehouseRef: entitySettings.senderWarehouseRef,
      counterpartyRef: entitySettings.senderCounterpartyRef,
      contactPersonRef: entitySettings.senderContactPersonRef,
      phone: entitySettings.senderPhone ?? "",
    },
    recipient:
      input.npType === "address"
        ? {
            kind: "new_recipient",
            cityRef: input.recipientCityRef,
            cityName: input.recipientCity,
            streetRef: input.recipientStreetRef,
            houseNumber: input.recipientHouseNumber,
            fullName: input.recipientName,
            phone: input.recipientPhone,
          }
        : {
            kind: "new_recipient",
            cityRef: input.recipientCityRef,
            cityName: input.recipientCity,
            warehouseRef: input.recipientWarehouseRef,
            fullName: input.recipientName,
            phone: input.recipientPhone,
          },
  };

  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    const shipment = await provider.createShipment(shipmentInput);
    return { ok: true, shipment };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося створити ЕН Нової пошти" };
  }
}

export type DeleteShipmentNowResult = { ok: true } | { ok: false; message: string };

/** Реальне скасування ЕН (docs/carriers/novaposhta/shipments.md, delete) — пряма вказівка людини, четвертий прохід. */
export async function deleteShipmentNowAction(
  ref: string,
  deliveryMethodId: string,
  legalEntityId: string
): Promise<DeleteShipmentNowResult> {
  const tenantId = getDevTenantId();
  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === deliveryMethodId);
  const entitySettings = findEntitySettings(allEntitySettings, deliveryMethodId, legalEntityId);
  if (!deliveryMethod || !entitySettings?.apiKey) {
    return { ok: false, message: "Спосіб доставки не знайдено або не налаштовано" };
  }
  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    await provider.deleteShipment(ref);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося видалити ЕН" };
  }
}

export type PrintShipmentNowResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Друк ЕН/маркування ОДРАЗУ після створення (пряма вказівка людини —
 * «друк маркування має бути доступним одразу після створення ЕН», четвертий
 * прохід) — на відміну від `printShipmentDocumentsAction` нижче, не читає
 * замовлення з БД (воно ще не існує на цьому етапі форми), працює прямо з
 * `ref`, отриманим від `createShipmentNowAction`.
 */
export async function printShipmentNowAction(
  ref: string,
  kind: "document" | "marking",
  deliveryMethodId: string,
  legalEntityId: string
): Promise<PrintShipmentNowResult> {
  const tenantId = getDevTenantId();
  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === deliveryMethodId);
  const entitySettings = findEntitySettings(allEntitySettings, deliveryMethodId, legalEntityId);
  if (!deliveryMethod || !entitySettings?.apiKey) {
    return { ok: false, message: "Спосіб доставки не знайдено або не налаштовано" };
  }
  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    const result = await provider.printDocuments({ documentRefs: [ref], kind });
    return { ok: true, url: result.url };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося сформувати посилання на друк" };
  }
}

export type TrackShipmentActionResult =
  | { ok: true; result: TrackShipmentResult }
  | { ok: false; message: string };

/** Реальний статус ЕН у Новій пошті (docs/carriers/novaposhta/tracking-returns-redirects.md) — четвертий прохід, read-only. */
export async function trackShipmentAction(
  documentNumber: string,
  deliveryMethodId: string,
  legalEntityId: string
): Promise<TrackShipmentActionResult> {
  const tenantId = getDevTenantId();
  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === deliveryMethodId);
  const entitySettings = findEntitySettings(allEntitySettings, deliveryMethodId, legalEntityId);
  if (!deliveryMethod || !entitySettings?.apiKey) {
    return { ok: false, message: "Спосіб доставки не знайдено або не налаштовано" };
  }
  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    const result = await provider.track(documentNumber);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося отримати статус ЕН" };
  }
}

export async function createOrderAction(input: OrderFormInput): Promise<CreateOrderResult> {
  const tenantId = getDevTenantId();

  const name = input.customerName.trim();
  const phone = input.customerPhone.trim();
  if (!name) return { ok: false, message: "Вкажіть ім'я клієнта" };
  if (phone.replace(/\D/g, "").length < 12) return { ok: false, message: "Вкажіть коректний телефон клієнта" };
  if (input.items.length === 0) return { ok: false, message: "Додайте хоча б одну позицію товару" };
  if (!input.legalEntityId) return { ok: false, message: "Оберіть юридичну особу замовлення" };
  if (!input.paymentStatusId) return { ok: false, message: "Оберіть статус оплати" };

  const items: CreateOrderItemInput[] = input.items.map((item) => ({
    productSkuId: item.productSkuId || null,
    productName: item.productName,
    sku: item.sku,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountType: item.discountType,
    discountValue: item.discountValue,
  }));

  // Опис вантажу — рахуємо реально (не з клієнтського тексту, §6 CLAUDE.md)
  // з налаштувань обраного способу доставки + карток товару, createOrder
  // сам підставить номер замовлення (buildShipmentDescription, невідомий тут
  // до генерації в транзакції).
  let descriptionContent: DeliveryMethodEntitySettingsRow["descriptionContent"] | null = null;
  let descriptionIncludeQuantity = true;
  if (input.deliveryMethodId) {
    const allEntitySettings = await listAllDeliveryMethodEntitySettings(tenantId);
    const entitySettings = findEntitySettings(allEntitySettings, input.deliveryMethodId, input.legalEntityId);
    if (entitySettings) {
      descriptionContent = entitySettings.descriptionContent;
      descriptionIncludeQuantity = entitySettings.descriptionIncludeQuantity;
    }
  }

  let order: OrderRow;
  try {
    ({ order } = await createOrder(tenantId, {
      customer: { name, phone, email: input.customerEmail.trim() || null, comment: input.customerComment.trim() || null },
      legalEntityId: input.legalEntityId,
      paymentMethodId: input.paymentMethodId || null,
      paymentStatusId: input.paymentStatusId,
      source: input.source,
      managerName: DEV_USER.name, // TODO(auth) — клієнту ще нема кому призначати менеджера, реального списку користувачів нема
      createdByName: DEV_USER.name, // TODO(auth)
      notes: input.notes.trim() || null,
      itemsNote: input.itemsNote.trim() || null,
      orderDate: input.orderDate,
      expectedShipmentDate: input.expectedShipmentDate,
      discountType: input.discountType,
      discountValue: input.discountValue,
      promoCode: input.promoCode.trim() || null,
      warehouseId: input.warehouseId || null,
      usePackaging: input.usePackaging,
      packagingRef: input.packagingRef || null,
      packagingName: input.packagingName || null,
      weightKg: input.weightKg ? Number(input.weightKg) : null,
      packageLengthCm: input.packageLengthCm ? Number(input.packageLengthCm) : null,
      packageWidthCm: input.packageWidthCm ? Number(input.packageWidthCm) : null,
      packageHeightCm: input.packageHeightCm ? Number(input.packageHeightCm) : null,
      seatsAmount: Number(input.seatsAmount) || 1,
      declaredValue: input.declaredValue ? Number(input.declaredValue) : null,
      shipmentDescriptionContent: descriptionContent,
      shipmentDescriptionIncludeQuantity: descriptionIncludeQuantity,
      partialAmount: input.partialAmount,
      deliveryCost: input.deliveryCost ? Number(input.deliveryCost) : null,
      deliveryMethodId: input.deliveryMethodId || null,
      recipientName: input.recipientName.trim() || null,
      recipientPhone: input.recipientPhone.trim() || null,
      recipientCityRef: input.recipientCityRef || null,
      recipientCity: input.recipientCity || null,
      recipientWarehouseRef: input.recipientWarehouseRef || null,
      recipientWarehouse: input.recipientWarehouse || null,
      recipientStreetRef: input.recipientStreetRef || null,
      recipientStreet: input.recipientStreet || null,
      recipientHouseNumber: input.recipientHouseNumber || null,
      // ЕН (якщо створювали) — уже реальний результат createShipmentNowAction,
      // просто записується разом із замовленням (четвертий прохід, більше не
      // окремий виклик carrier API під час сабміту).
      shipmentTtn: input.shipmentTtn || null,
      shipmentRef: input.shipmentRef || null,
      shipmentCostOnSite: input.shipmentCostOnSite ? Number(input.shipmentCostOnSite) : null,
      shipmentEstimatedDeliveryDate: input.shipmentEstimatedDeliveryDate || null,
      items,
    }));
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося створити замовлення" };
  }

  revalidatePath("/orders");
  return { ok: true, order };
}

export interface CalculateDeliveryCostInput {
  deliveryMethodId: string;
  legalEntityId: string;
  npType: NpDeliveryTypeValue;
  cityToRef: string;
  weightKg: string;
  declaredValue: string;
  seatsAmount: string;
  packagingRef: string;
}

export type CalculateDeliveryCostResult =
  | { ok: true; result: CalculateShipmentResult }
  | { ok: false; message: string };

/**
 * Реальний виклик getDocumentPrice (docs/carriers/novaposhta/shipments.md) —
 * документовано як безпечний для живого тесту (чисте обчислення, без
 * побічного ефекту), на відміну від createShipment.
 */
export async function calculateDeliveryCostAction(
  input: CalculateDeliveryCostInput
): Promise<CalculateDeliveryCostResult> {
  const tenantId = getDevTenantId();
  if (!input.deliveryMethodId || !input.legalEntityId || !input.cityToRef) {
    return { ok: false, message: "Оберіть спосіб доставки, юридичну особу й місто отримувача" };
  }
  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === input.deliveryMethodId);
  if (!deliveryMethod) return { ok: false, message: "Спосіб доставки не знайдено" };
  if (deliveryMethod.carrierKey !== "nova_poshta") {
    return { ok: false, message: "Розрахунок вартості підключено поки лише для Нової пошти" };
  }
  const entitySettings = findEntitySettings(allEntitySettings, input.deliveryMethodId, input.legalEntityId);
  if (!entitySettings?.apiKey || !entitySettings.senderCityRef) {
    return { ok: false, message: "У обраної юридичної особи не налаштовано відправника (settings → Доставка)" };
  }

  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    const result = await provider.calculate({
      cityFromRef: entitySettings.senderCityRef,
      cityToRef: input.cityToRef,
      weightKg: Number(input.weightKg) || 0.5,
      serviceType: computeServiceType(entitySettings.senderAddressType, input.npType),
      declaredValue: Number(input.declaredValue) || 0,
      cargoType: "Parcel",
      seatsAmount: Number(input.seatsAmount) || 1,
      packRef: input.packagingRef || undefined,
    });
    return { ok: true, result };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося розрахувати вартість доставки" };
  }
}

export type PrintShipmentDocumentsResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Друк ЕН/маркування (docs/carriers/novaposhta/printing.md, третій прохід —
 * пряма вказівка людини) — доступно лише для ВЖЕ створеного відправлення
 * (order.carrierShipmentRef, четвертий прохід — ЕН створюється до сабміту,
 * createShipmentNowAction). printDocuments() не робить мережевого виклику,
 * лише формує URL — сам PDF відкривається в новій вкладці на клієнті.
 */
export async function printShipmentDocumentsAction(
  orderId: string,
  kind: "document" | "marking"
): Promise<PrintShipmentDocumentsResult> {
  const tenantId = getDevTenantId();
  const order = await getOrderById(tenantId, orderId);
  if (!order) return { ok: false, message: "Замовлення не знайдено" };
  if (!order.carrierShipmentRef) return { ok: false, message: "ЕН ще не створено для цього замовлення" };
  if (!order.deliveryMethodId) return { ok: false, message: "Спосіб доставки не визначено" };

  const [methods, allEntitySettings] = await Promise.all([
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);
  const deliveryMethod = methods.find((m) => m.id === order.deliveryMethodId);
  if (!deliveryMethod || deliveryMethod.carrierKey !== "nova_poshta") {
    return { ok: false, message: "Друк підключено поки лише для Нової пошти" };
  }
  const entitySettings = findEntitySettings(allEntitySettings, order.deliveryMethodId, order.legalEntityId);
  if (!entitySettings?.apiKey) {
    return { ok: false, message: "У способу доставки не задано API-ключ (settings → Доставка)" };
  }

  try {
    const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
    const result: PrintDocumentsResult = await provider.printDocuments({
      documentRefs: [order.carrierShipmentRef],
      kind,
    });
    return { ok: true, url: result.url };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося сформувати посилання на друк" };
  }
}
