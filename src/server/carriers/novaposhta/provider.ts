import {
  CarrierNotImplementedError,
  type CalculateShipmentResult,
  type CarrierCity,
  type CarrierCounterparty,
  type CarrierProvider,
  type CarrierSettlement,
  type CarrierStreet,
  type CarrierWarehouse,
  type PrintDocumentsResult,
  type ShipmentResult,
  type TrackShipmentResult,
} from "../carrier.interface";
import { callNovaPoshta } from "./client";
import { NP_METHOD, NP_MODEL } from "./endpoints";
import {
  mapCity,
  mapContactPerson,
  mapCounterparty,
  mapPackItem,
  mapStreet,
  mapWarehouse,
  type NovaPoshtaContactPerson,
  type NovaPoshtaPackItem,
} from "./mapper";
import type {
  NpCityRaw,
  NpContactPersonRaw,
  NpCounterpartyRaw,
  NpPackItemRaw,
  NpStreetRaw,
  NpWarehouseRaw,
} from "./types";

const CARRIER_KEY = "nova_poshta";

/**
 * Уся специфіка Нової пошти живе тут — CRM ніколи не бачить modelName/
 * calledMethod/поля відповіді напряму (пряма архітектурна вимога людини).
 * ✅-методи нижче перевірені живим викликом цієї сесії
 * (docs/carriers/novaposhta/reference-data.md); методи, що кидають
 * CarrierNotImplementedError, задокументовані в docs/carriers/novaposhta/,
 * але вимагають ручної звірки з офіційним API перед реалізацією (реальний
 * побічний ефект — створення/скасування справжнього відправлення).
 */
export class NovaPoshtaProvider implements CarrierProvider {
  constructor(private readonly apiKey: string) {}

  /** Не частина CarrierProvider — той самий виклик, що testDeliveryApiKeyAction. */
  async testConnection(): Promise<void> {
    await this.getCities("Київ");
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  async getCities(query: string): Promise<CarrierCity[]> {
    const rows = await callNovaPoshta<NpCityRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getCities, {
      FindByString: query,
      Limit: "20",
    });
    return rows.map(mapCity);
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  async getWarehouses(cityRef: string, query: string): Promise<CarrierWarehouse[]> {
    const rows = await callNovaPoshta<NpWarehouseRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getWarehouses, {
      CityRef: cityRef,
      FindByString: query,
      Limit: "20",
    });
    return rows.map(mapWarehouse);
  }

  // ✅ docs/carriers/novaposhta/reference-data.md
  async getCounterparties(): Promise<CarrierCounterparty[]> {
    const rows = await callNovaPoshta<NpCounterpartyRaw>(
      this.apiKey,
      NP_MODEL.counterparty,
      NP_METHOD.getCounterparties,
      { CounterpartyProperty: "Sender", Page: "1" }
    );
    return rows.map(mapCounterparty);
  }

  /** Не частина CarrierProvider (не всі перевізники моделюють контактну особу окремо) — ✅ перевірено живим викликом. */
  async getContactPersons(counterpartyRef: string): Promise<NovaPoshtaContactPerson[]> {
    const rows = await callNovaPoshta<NpContactPersonRaw>(
      this.apiKey,
      NP_MODEL.counterparty,
      NP_METHOD.getCounterpartyContactPersons,
      { Ref: counterpartyRef, Page: "1" }
    );
    return rows.map(mapContactPerson);
  }

  /** Не частина CarrierProvider — ✅ перевірено живим викликом. */
  async getPackList(): Promise<NovaPoshtaPackItem[]> {
    const rows = await callNovaPoshta<NpPackItemRaw>(this.apiKey, NP_MODEL.commonGeneral, NP_METHOD.getPackList, {});
    return rows.map(mapPackItem);
  }

  // ⚠️ docs/carriers/novaposhta/shipments.md — задокументовано, не реалізовано.
  // Параметри навмисно без назв (не використовуються) — TS дозволяє
  // реалізації інтерфейсу мати коротший список параметрів.
  async calculate(): Promise<CalculateShipmentResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "calculate");
  }

  // ⚠️ docs/carriers/novaposhta/shipments.md
  async createShipment(): Promise<ShipmentResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "createShipment");
  }

  // ⚠️ docs/carriers/novaposhta/shipments.md
  async updateShipment(): Promise<ShipmentResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "updateShipment");
  }

  // ⚠️ docs/carriers/novaposhta/shipments.md
  async deleteShipment(): Promise<void> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "deleteShipment");
  }

  // ⚠️ docs/carriers/novaposhta/tracking-returns-redirects.md
  async track(): Promise<TrackShipmentResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "track");
  }

  // ⚠️ docs/carriers/novaposhta/tracking-returns-redirects.md — точний метод AdditionalService потребує звірки
  async createReturn(): Promise<{ ref: string }> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "createReturn");
  }

  // ⚠️ docs/carriers/novaposhta/tracking-returns-redirects.md
  async redirectShipment(): Promise<{ ref: string }> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "redirectShipment");
  }

  // ✅ docs/carriers/novaposhta/reference-data.md — реальний метод "getStreet"
  // (однина!), не "getStreets" — та сама гочка, що з Reference/CommonGeneral.
  async getStreets(cityRef: string, query: string): Promise<CarrierStreet[]> {
    const rows = await callNovaPoshta<NpStreetRaw>(this.apiKey, NP_MODEL.address, NP_METHOD.getStreet, {
      CityRef: cityRef,
      FindByString: query,
      Limit: "20",
    });
    return rows.map(mapStreet);
  }

  // ⚠️ не просили ще — Address.searchSettlements
  async getSettlement(): Promise<CarrierSettlement[]> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "getSettlement");
  }

  // ⚠️ docs/carriers/novaposhta/printing.md — не JSON RPC, окремий механізм, потребує звірки
  async printDocuments(): Promise<PrintDocumentsResult> {
    throw new CarrierNotImplementedError(CARRIER_KEY, "printDocuments");
  }
}
