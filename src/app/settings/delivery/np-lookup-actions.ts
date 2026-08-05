"use server";

import {
  listNovaPoshtaContactPersons,
  listNovaPoshtaPackList,
  listNovaPoshtaSenderCounterparties,
  searchNovaPoshtaCities,
  searchNovaPoshtaWarehouses,
  type NpCity,
  type NpContactPerson,
  type NpCounterparty,
  type NpPackItem,
  type NpWarehouse,
} from "@/server/integrations/nova-poshta";

/**
 * Живі довідники Нової пошти для попапу способу доставки — з уведеним (не
 * обов'язково збереженим) ключем, той самий підхід, що testDeliveryApiKeyAction.
 * Лише для carrierKey === "nova_poshta" (settings-delivery.md) — виклик з UI
 * не робиться для інших перевізників, тут немає прив'язки до конкретного
 * перевізника навмисно (сам клієнт — тонка обгортка над api.novaposhta.ua).
 */

type Result<T> = { ok: true; items: T[] } | { ok: false; message: string };

function toResult<T>(promise: Promise<T[]>): Promise<Result<T>> {
  return promise
    .then((items) => ({ ok: true as const, items }))
    .catch((err) => ({
      ok: false as const,
      message: err instanceof Error ? err.message : "Не вдалося з'єднатися з Новою поштою",
    }));
}

export async function searchDeliveryCitiesAction(apiKey: string, query: string): Promise<Result<NpCity>> {
  if (!apiKey.trim() || query.trim().length < 2) return { ok: true, items: [] };
  return toResult(searchNovaPoshtaCities(apiKey, query));
}

export async function searchDeliveryWarehousesAction(
  apiKey: string,
  cityRef: string,
  query: string
): Promise<Result<NpWarehouse>> {
  if (!apiKey.trim() || !cityRef) return { ok: true, items: [] };
  return toResult(searchNovaPoshtaWarehouses(apiKey, cityRef, query));
}

export async function listSenderCounterpartiesAction(apiKey: string): Promise<Result<NpCounterparty>> {
  if (!apiKey.trim()) return { ok: true, items: [] };
  return toResult(listNovaPoshtaSenderCounterparties(apiKey));
}

export async function listContactPersonsAction(
  apiKey: string,
  counterpartyRef: string
): Promise<Result<NpContactPerson>> {
  if (!apiKey.trim() || !counterpartyRef) return { ok: true, items: [] };
  return toResult(listNovaPoshtaContactPersons(apiKey, counterpartyRef));
}

export async function listPackListAction(apiKey: string): Promise<Result<NpPackItem>> {
  if (!apiKey.trim()) return { ok: true, items: [] };
  return toResult(listNovaPoshtaPackList(apiKey));
}
