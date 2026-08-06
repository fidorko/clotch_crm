import type {
  CarrierCity,
  CarrierCounterparty,
  CarrierStreet,
  CarrierWarehouse,
  ShipmentResult,
} from "../carrier.interface";
import type {
  NpCityRaw,
  NpContactPersonRaw,
  NpCounterpartyRaw,
  NpPackItemRaw,
  NpSaveDocumentRaw,
  NpStreetRaw,
  NpWarehouseRaw,
} from "./types";

export function mapCity(raw: NpCityRaw): CarrierCity {
  return { ref: raw.Ref, name: raw.Description };
}

export function mapWarehouse(raw: NpWarehouseRaw): CarrierWarehouse {
  return { ref: raw.Ref, name: raw.Description, address: raw.ShortAddress };
}

export function mapStreet(raw: NpStreetRaw): CarrierStreet {
  return { ref: raw.Ref, name: `${raw.StreetsType} ${raw.Description}` };
}

export function mapCounterparty(raw: NpCounterpartyRaw): CarrierCounterparty {
  return { ref: raw.Ref, name: raw.Description };
}

// Контактна особа й пакування — не частина універсального CarrierProvider
// (не всі перевізники моделюють це однаково), тому власні NP-специфічні
// типи результату, не з carrier.interface.ts.
export interface NovaPoshtaContactPerson {
  ref: string;
  name: string;
  phone: string;
}

export function mapContactPerson(raw: NpContactPersonRaw): NovaPoshtaContactPerson {
  return { ref: raw.Ref, name: raw.Description, phone: `+${raw.Phones}` };
}

export interface NovaPoshtaPackItem {
  ref: string;
  name: string;
}

export function mapPackItem(raw: NpPackItemRaw): NovaPoshtaPackItem {
  return { ref: raw.Ref, name: raw.Description };
}

export function mapShipmentResult(raw: NpSaveDocumentRaw): ShipmentResult {
  return {
    ref: raw.Ref,
    documentNumber: raw.IntDocNumber,
    costOnSite: raw.CostOnSite ? Number(raw.CostOnSite) : null,
    estimatedDeliveryDate: raw.EstimatedDeliveryDate || null,
  };
}

/** "+380XXXXXXXXX" (conventions.md, нормалізований формат у БД) → без "+" — так його очікує API (reference-data.md, `Phones` теж без "+"). */
export function toNpPhone(phone: string): string {
  return phone.replace(/^\+/, "");
}

/** InternetDocument.save очікує дату відправлення в форматі DD.MM.YYYY (conventions.md). */
export function formatNpDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
}

// payer у delivery_methods — наш внутрішній enum (schema/delivery-methods.ts),
// не Ref Нової пошти — переклад ховається тут, не в CRM-коді, що створює замовлення.
const PAYER_TO_NP_REF: Record<string, string> = {
  sender: "Sender",
  recipient: "Recipient",
  third_party: "ThirdPerson",
};

export function payerToNpRef(payer: string): string {
  return PAYER_TO_NP_REF[payer] ?? "Recipient";
}
