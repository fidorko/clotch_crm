"use server";

import { revalidatePath } from "next/cache";
import {
  createDeliveryMethod as createDeliveryMethodInDb,
  deleteDeliveryMethod as deleteDeliveryMethodInDb,
  updateDeliveryMethod as updateDeliveryMethodInDb,
  type DeliveryMethodRow,
} from "@/server/data/delivery-methods";
import {
  upsertDeliveryMethodEntitySettings,
  type DeliveryMethodDeclaredValueMode,
  type DeliveryMethodDescriptionContent,
  type DeliveryMethodEntitySettingsInput,
  type DeliveryMethodEntitySettingsRow,
  type DeliveryMethodMarkingPrinterType,
  type DeliveryMethodPayer,
  type DeliveryMethodSenderAddressType,
  type DeliveryMethodStatusRuleInput,
} from "@/server/data/delivery-method-entity-settings";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { NovaPoshtaProvider } from "@/server/carriers/novaposhta/provider";

// --- Список способів доставки (спільний на тенанта, settings-delivery.md) ---

export interface DeliveryMethodFormInput {
  name: string;
  requiresApiKey: boolean;
  isEnabled: boolean;
}

export async function createDeliveryMethodAction(
  input: DeliveryMethodFormInput
): Promise<DeliveryMethodRow> {
  const tenantId = getDevTenantId();
  const name = input.name.trim();
  if (!name) throw new Error("Назва обов'язкова");
  const row = await createDeliveryMethodInDb(tenantId, {
    name,
    requiresApiKey: input.requiresApiKey,
    isEnabled: input.isEnabled,
  });
  revalidatePath("/settings");
  return row;
}

export async function updateDeliveryMethodAction(
  id: string,
  input: DeliveryMethodFormInput
): Promise<void> {
  const tenantId = getDevTenantId();
  const name = input.name.trim();
  if (!name) throw new Error("Назва обов'язкова");
  await updateDeliveryMethodInDb(tenantId, id, {
    name,
    requiresApiKey: input.requiresApiKey,
    isEnabled: input.isEnabled,
  });
  revalidatePath("/settings");
}

/** Швидкий тогл вмикача зі списку — isEnabled тепер живе прямо на delivery_methods, не чіпає конфігурації жодної юридичної особи. */
export async function toggleDeliveryMethodAction(
  id: string,
  current: DeliveryMethodRow,
  isEnabled: boolean
): Promise<void> {
  const tenantId = getDevTenantId();
  await updateDeliveryMethodInDb(tenantId, id, {
    name: current.name,
    requiresApiKey: current.requiresApiKey,
    isEnabled,
  });
  revalidatePath("/settings");
}

export async function deleteDeliveryMethodAction(id: string): Promise<void> {
  const tenantId = getDevTenantId();
  await deleteDeliveryMethodInDb(tenantId, id);
  revalidatePath("/settings");
}

// --- Конфігурація способу доставки для конкретної юридичної особи ---

export interface DeliveryMethodEntitySettingsFormInput {
  apiKey: string;
  senderCounterpartyRef: string;
  senderCounterparty: string;
  senderContactPersonRef: string;
  senderContactPerson: string;
  senderPhone: string;
  senderAddressType: DeliveryMethodSenderAddressType;
  senderCityRef: string;
  senderCity: string;
  senderWarehouseRef: string;
  senderAddressOrWarehouse: string;
  senderStreetRef: string;
  senderStreet: string;
  senderHouseNumber: string;
  payer: DeliveryMethodPayer;
  declaredValueMode: DeliveryMethodDeclaredValueMode;
  declaredValueMinimum: string;
  syncFrequencyMinutes: string;
  orderReturnOnRefusal: boolean;
  useCarrierPackaging: boolean;
  markingPrinterType: DeliveryMethodMarkingPrinterType;
  descriptionContent: DeliveryMethodDescriptionContent;
  descriptionIncludeQuantity: boolean;
  statusRules: DeliveryMethodStatusRuleInput[];
}

/**
 * Усі поля обов'язкові, окрім прямої вказівки людини (2026-08-06): правила
 * статусів (0..N, лишається опційним списком) і частота синхронізації
 * (опційна, за замовчуванням "1" — форма сама підставляє, тут лише
 * дозволяємо порожнє). Радіо/перемикачі (payer/useCarrierPackaging/
 * descriptionContent/markingPrinterType/senderAddressType) завжди мають
 * значення — валідувати «порожнє» для них нема сенсу.
 */
function parseEntitySettingsInput(
  raw: DeliveryMethodEntitySettingsFormInput
): DeliveryMethodEntitySettingsInput {
  if (!raw.apiKey.trim()) throw new Error("API-ключ обов'язковий");
  if (!raw.senderCounterparty.trim()) throw new Error("Контрагент обов'язковий");
  if (!raw.senderContactPerson.trim()) throw new Error("Контактна особа обов'язкова");
  if (!raw.senderPhone.trim()) throw new Error("Телефон відправника обов'язковий");
  if (!raw.senderCity.trim()) throw new Error("Місто відправника обов'язкове");
  if (raw.senderAddressType === "warehouse") {
    if (!raw.senderAddressOrWarehouse.trim()) throw new Error("Відділення відправника обов'язкове");
  } else {
    if (!raw.senderStreet.trim()) throw new Error("Вулиця відправника обов'язкова");
    if (!raw.senderHouseNumber.trim()) throw new Error("Номер будинку відправника обов'язковий");
  }
  if (raw.declaredValueMode === "minimum_amount" && !raw.declaredValueMinimum.trim()) {
    throw new Error("Мінімальна оголошена вартість обов'язкова");
  }

  const syncFrequencyMinutes = raw.syncFrequencyMinutes.trim()
    ? Number(raw.syncFrequencyMinutes)
    : null;
  if (syncFrequencyMinutes !== null && (!Number.isFinite(syncFrequencyMinutes) || syncFrequencyMinutes < 0)) {
    throw new Error("Частота синхронізації — невід'ємне число хвилин");
  }

  return {
    apiKey: raw.apiKey.trim() || null,
    senderCounterpartyRef: raw.senderCounterpartyRef.trim() || null,
    senderCounterparty: raw.senderCounterparty.trim() || null,
    senderContactPersonRef: raw.senderContactPersonRef.trim() || null,
    senderContactPerson: raw.senderContactPerson.trim() || null,
    senderPhone: raw.senderPhone.trim() || null,
    senderAddressType: raw.senderAddressType,
    senderCityRef: raw.senderCityRef.trim() || null,
    senderCity: raw.senderCity.trim() || null,
    senderWarehouseRef: raw.senderWarehouseRef.trim() || null,
    senderAddressOrWarehouse: raw.senderAddressOrWarehouse.trim() || null,
    senderStreetRef: raw.senderStreetRef.trim() || null,
    senderStreet: raw.senderStreet.trim() || null,
    senderHouseNumber: raw.senderHouseNumber.trim() || null,
    payer: raw.payer,
    declaredValueMode: raw.declaredValueMode,
    declaredValueMinimum: raw.declaredValueMinimum.trim() || null,
    syncFrequencyMinutes,
    orderReturnOnRefusal: raw.orderReturnOnRefusal,
    useCarrierPackaging: raw.useCarrierPackaging,
    markingPrinterType: raw.markingPrinterType,
    descriptionContent: raw.descriptionContent,
    descriptionIncludeQuantity: raw.descriptionIncludeQuantity,
    statusRules: raw.statusRules,
  };
}

export async function saveDeliveryMethodEntitySettingsAction(
  deliveryMethodId: string,
  legalEntityId: string,
  input: DeliveryMethodEntitySettingsFormInput
): Promise<DeliveryMethodEntitySettingsRow> {
  const tenantId = getDevTenantId();
  const parsed = parseEntitySettingsInput(input);
  const row = await upsertDeliveryMethodEntitySettings(tenantId, deliveryMethodId, legalEntityId, parsed);
  revalidatePath("/settings");
  return row;
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
    await new NovaPoshtaProvider(apiKey.trim()).testConnection();
    return { ok: true, message: "Ключ дійсний, з'єднання з Новою поштою працює" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Не вдалося з'єднатися з Новою поштою" };
  }
}
