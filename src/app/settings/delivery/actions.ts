"use server";

import { revalidatePath } from "next/cache";
import {
  createDeliveryMethod as createDeliveryMethodInDb,
  deleteDeliveryMethod as deleteDeliveryMethodInDb,
  listAllDeliveryMethodStatusRules,
  updateDeliveryMethod as updateDeliveryMethodInDb,
  type DeliveryMethodDeclaredValueMode,
  type DeliveryMethodDescriptionContent,
  type DeliveryMethodInput,
  type DeliveryMethodPackaging,
  type DeliveryMethodPayer,
  type DeliveryMethodRow,
  type DeliveryMethodStatusRuleInput,
} from "@/server/data/delivery-methods";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { searchNovaPoshtaCities } from "@/server/integrations/nova-poshta";

export interface DeliveryMethodFormInput {
  name: string;
  requiresApiKey: boolean;
  apiKey: string;
  isEnabled: boolean;
  senderCounterpartyRef: string;
  senderCounterparty: string;
  senderContactPersonRef: string;
  senderContactPerson: string;
  senderPhone: string;
  senderCityRef: string;
  senderCity: string;
  senderWarehouseRef: string;
  senderAddressOrWarehouse: string;
  allowedServiceTypes: string[];
  payer: DeliveryMethodPayer;
  declaredValueMode: DeliveryMethodDeclaredValueMode;
  declaredValueMinimum: string;
  syncFrequencyMinutes: string;
  orderReturnOnRefusal: boolean;
  packaging: DeliveryMethodPackaging;
  packRef: string;
  packDescription: string;
  labelFormat: string;
  waybillFormat: string;
  printerName: string;
  descriptionContent: DeliveryMethodDescriptionContent;
  descriptionIncludeQuantity: boolean;
  statusRules: DeliveryMethodStatusRuleInput[];
}

function parseDeliveryMethodInput(raw: DeliveryMethodFormInput): DeliveryMethodInput {
  const name = raw.name.trim();
  if (!name) throw new Error("Назва обов'язкова");

  const syncFrequencyMinutes = raw.syncFrequencyMinutes.trim()
    ? Number(raw.syncFrequencyMinutes)
    : null;
  if (syncFrequencyMinutes !== null && (!Number.isFinite(syncFrequencyMinutes) || syncFrequencyMinutes < 0)) {
    throw new Error("Частота синхронізації — невід'ємне число хвилин");
  }

  return {
    name,
    requiresApiKey: raw.requiresApiKey,
    apiKey: raw.apiKey.trim() || null,
    isEnabled: raw.isEnabled,
    senderCounterpartyRef: raw.senderCounterpartyRef.trim() || null,
    senderCounterparty: raw.senderCounterparty.trim() || null,
    senderContactPersonRef: raw.senderContactPersonRef.trim() || null,
    senderContactPerson: raw.senderContactPerson.trim() || null,
    senderPhone: raw.senderPhone.trim() || null,
    senderCityRef: raw.senderCityRef.trim() || null,
    senderCity: raw.senderCity.trim() || null,
    senderWarehouseRef: raw.senderWarehouseRef.trim() || null,
    senderAddressOrWarehouse: raw.senderAddressOrWarehouse.trim() || null,
    allowedServiceTypes: raw.allowedServiceTypes,
    payer: raw.payer,
    declaredValueMode: raw.declaredValueMode,
    declaredValueMinimum: raw.declaredValueMinimum.trim() || null,
    syncFrequencyMinutes,
    orderReturnOnRefusal: raw.orderReturnOnRefusal,
    packaging: raw.packaging,
    packRef: raw.packRef.trim() || null,
    packDescription: raw.packDescription.trim() || null,
    labelFormat: raw.labelFormat.trim() || null,
    waybillFormat: raw.waybillFormat.trim() || null,
    printerName: raw.printerName.trim() || null,
    descriptionContent: raw.descriptionContent,
    descriptionIncludeQuantity: raw.descriptionIncludeQuantity,
    statusRules: raw.statusRules,
  };
}

export async function createDeliveryMethodAction(
  input: DeliveryMethodFormInput
): Promise<DeliveryMethodRow> {
  const tenantId = getDevTenantId();
  const parsed = parseDeliveryMethodInput(input);
  const row = await createDeliveryMethodInDb(tenantId, parsed);
  revalidatePath("/settings");
  return row;
}

export async function updateDeliveryMethodAction(
  id: string,
  input: DeliveryMethodFormInput
): Promise<void> {
  const tenantId = getDevTenantId();
  const parsed = parseDeliveryMethodInput(input);
  await updateDeliveryMethodInDb(tenantId, id, parsed);
  revalidatePath("/settings");
}

/** Швидкий тогл вмикача — не відкриваючи попап редагування. Не чіпає жодне інше поле рядка. */
export async function toggleDeliveryMethodAction(
  id: string,
  current: DeliveryMethodRow,
  isEnabled: boolean
): Promise<void> {
  const tenantId = getDevTenantId();
  await updateDeliveryMethodInDb(tenantId, id, {
    name: current.name,
    requiresApiKey: current.requiresApiKey,
    apiKey: current.apiKey,
    isEnabled,
    senderCounterpartyRef: current.senderCounterpartyRef,
    senderCounterparty: current.senderCounterparty,
    senderContactPersonRef: current.senderContactPersonRef,
    senderContactPerson: current.senderContactPerson,
    senderPhone: current.senderPhone,
    senderCityRef: current.senderCityRef,
    senderCity: current.senderCity,
    senderWarehouseRef: current.senderWarehouseRef,
    senderAddressOrWarehouse: current.senderAddressOrWarehouse,
    allowedServiceTypes: current.allowedServiceTypes,
    payer: current.payer,
    declaredValueMode: current.declaredValueMode,
    declaredValueMinimum: current.declaredValueMinimum,
    syncFrequencyMinutes: current.syncFrequencyMinutes,
    orderReturnOnRefusal: current.orderReturnOnRefusal,
    packaging: current.packaging,
    packRef: current.packRef,
    packDescription: current.packDescription,
    labelFormat: current.labelFormat,
    waybillFormat: current.waybillFormat,
    printerName: current.printerName,
    descriptionContent: current.descriptionContent,
    descriptionIncludeQuantity: current.descriptionIncludeQuantity,
    // Тогл не редагує правила статусів — читаємо й пишемо назад той самий
    // набір, щоб не втратити його (updateDeliveryMethod завжди перезаписує
    // весь список, delete-then-insert). Швидкий тогл викликається лише з
    // рядка списку (DeliveryTab), де правил під рукою нема — тому тут пусто
    // означало б стерти їх; замість цього тогл у Server Action нижче читає
    // поточні правила сам.
    statusRules: await currentStatusRules(tenantId, id),
  });
  revalidatePath("/settings");
}

async function currentStatusRules(tenantId: string, deliveryMethodId: string) {
  const all = await listAllDeliveryMethodStatusRules(tenantId);
  return all
    .filter((r) => r.deliveryMethodId === deliveryMethodId)
    .map((r) => ({ carrierStatus: r.carrierStatus, orderStatusId: r.orderStatusId }));
}

export async function deleteDeliveryMethodAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteDeliveryMethodInDb(tenantId, id);
  revalidatePath("/settings");
}

/**
 * Реальний виклик API перевізника з введеним (не обов'язково збереженим)
 * ключем — лише Нова пошта підключена насправді (settings-delivery.md),
 * інші перевізники чесно повертають "не реалізовано", без вдавання.
 */
export async function testDeliveryApiKeyAction(
  carrierKey: string,
  apiKey: string
): Promise<{ ok: boolean; message: string }> {
  if (!apiKey.trim()) {
    return { ok: false, message: "Спершу введіть API-ключ" };
  }
  if (carrierKey !== "nova_poshta") {
    return { ok: false, message: "Перевірку підключення для цього перевізника ще не реалізовано" };
  }
  try {
    await searchNovaPoshtaCities(apiKey.trim(), "Київ");
    return { ok: true, message: "Ключ дійсний, з'єднання з Новою поштою працює" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося з'єднатися з Новою поштою" };
  }
}
