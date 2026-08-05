// Тонкий клієнт напряму проти api.novaposhta.ua (без npm-залежності від
// стороннього пакета — пряма вказівка людини, settings-delivery.md).
// Кожна функція — окремий виклик з ключем, який передає викликач (не
// обов'язково збережений у БД — той самий підхід, що testDeliveryApiKeyAction).

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

interface NpResponse<T> {
  success: boolean;
  data: T[];
  errors?: string[];
}

async function callNovaPoshta<T>(
  apiKey: string,
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, string> = {}
): Promise<T[]> {
  const response = await fetch(NP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
  });
  const data = (await response.json()) as NpResponse<T>;
  if (!data.success) {
    throw new Error(data.errors?.[0] || "Нова пошта повернула помилку");
  }
  return data.data;
}

export interface NpCity {
  ref: string;
  description: string;
}

export interface NpWarehouse {
  ref: string;
  description: string;
  shortAddress: string;
}

export interface NpCounterparty {
  ref: string;
  description: string;
}

export interface NpContactPerson {
  ref: string;
  description: string;
  phone: string;
}

export interface NpPackItem {
  ref: string;
  description: string;
}

export async function searchNovaPoshtaCities(apiKey: string, query: string): Promise<NpCity[]> {
  const rows = await callNovaPoshta<{ Ref: string; Description: string }>(apiKey, "Address", "getCities", {
    FindByString: query,
    Limit: "20",
  });
  return rows.map((r) => ({ ref: r.Ref, description: r.Description }));
}

export async function searchNovaPoshtaWarehouses(
  apiKey: string,
  cityRef: string,
  query: string
): Promise<NpWarehouse[]> {
  const rows = await callNovaPoshta<{ Ref: string; Description: string; ShortAddress: string }>(
    apiKey,
    "Address",
    "getWarehouses",
    { CityRef: cityRef, FindByString: query, Limit: "20" }
  );
  return rows.map((r) => ({ ref: r.Ref, description: r.Description, shortAddress: r.ShortAddress }));
}

export async function listNovaPoshtaSenderCounterparties(apiKey: string): Promise<NpCounterparty[]> {
  const rows = await callNovaPoshta<{ Ref: string; Description: string }>(
    apiKey,
    "Counterparty",
    "getCounterparties",
    { CounterpartyProperty: "Sender", Page: "1" }
  );
  return rows.map((r) => ({ ref: r.Ref, description: r.Description }));
}

export async function listNovaPoshtaContactPersons(
  apiKey: string,
  counterpartyRef: string
): Promise<NpContactPerson[]> {
  const rows = await callNovaPoshta<{ Ref: string; Description: string; Phones: string }>(
    apiKey,
    "Counterparty",
    "getCounterpartyContactPersons",
    { Ref: counterpartyRef, Page: "1" }
  );
  return rows.map((r) => ({ ref: r.Ref, description: r.Description, phone: r.Phones }));
}

export async function listNovaPoshtaPackList(apiKey: string): Promise<NpPackItem[]> {
  const rows = await callNovaPoshta<{ Ref: string; Description: string }>(
    apiKey,
    "CommonGeneral",
    "getPackList",
    {}
  );
  return rows.map((r) => ({ ref: r.Ref, description: r.Description }));
}
