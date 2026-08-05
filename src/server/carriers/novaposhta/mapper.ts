import type { CarrierCity, CarrierCounterparty, CarrierStreet, CarrierWarehouse } from "../carrier.interface";
import type {
  NpCityRaw,
  NpContactPersonRaw,
  NpCounterpartyRaw,
  NpPackItemRaw,
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
