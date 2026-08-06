// Універсальний інтерфейс перевізника (docs/carriers/novaposhta/business-mapping.md) —
// CRM звертається лише сюди, ніколи напряму до конкретного провайдера
// (пряма вказівка людини: "CRM не повинна знати нічого про особливості Нової
// пошти"). Додати Укрпошту/Meest/Rozetka в майбутньому — новий провайдер під
// цим самим інтерфейсом, без зміни коду, що його викликає.

export interface CarrierCity {
  ref: string;
  name: string;
}

export interface CarrierWarehouse {
  ref: string;
  name: string;
  address: string;
}

export interface CarrierStreet {
  ref: string;
  name: string;
}

export interface CarrierSettlement {
  ref: string;
  name: string;
  region: string;
}

export interface CarrierCounterparty {
  ref: string;
  name: string;
}

export interface CalculateShipmentInput {
  cityFromRef: string;
  cityToRef: string;
  weightKg: number;
  serviceType: string;
  declaredValue: number;
  cargoType: string;
  seatsAmount: number;
}

export interface CalculateShipmentResult {
  cost: number;
  costRedelivery: number | null;
}

// Відправник — завжди існуючий контрагент акаунта перевізника (обирається в
// налаштуваннях способу доставки, settings-delivery.md). Отримувач при
// оформленні замовлення — як правило НОВА людина, якої ще нема серед
// контрагентів перевізника (типовий e-commerce кейс, не наш саме клієнт CRM,
// а конкретна фізособа-отримувач) — тому окрема форма без counterpartyRef,
// перевізник створює контрагента-отримувача автоматично (docs/carriers/<carrier>/shipments.md).
export interface ShipmentCounterpartyAddress {
  kind: "counterparty";
  cityRef: string;
  warehouseRef?: string;
  counterpartyRef: string;
  contactPersonRef: string;
  phone: string;
}

export interface ShipmentNewRecipient {
  kind: "new_recipient";
  cityRef: string;
  cityName: string;
  warehouseRef: string;
  fullName: string;
  phone: string;
}

export type ShipmentAddress = ShipmentCounterpartyAddress | ShipmentNewRecipient;

export interface CreateShipmentInput {
  serviceType: string;
  payerType: string;
  paymentMethod: string;
  cargoType: string;
  weightKg: number;
  seatsAmount: number;
  description: string;
  declaredValue: number;
  sender: ShipmentAddress;
  recipient: ShipmentAddress;
}

export interface ShipmentResult {
  ref: string;
  documentNumber: string;
  costOnSite: number | null;
  estimatedDeliveryDate: string | null;
}

export interface TrackShipmentResult {
  documentNumber: string;
  statusCode: string;
  status: string;
  scheduledDeliveryDate: string | null;
}

export interface CreateReturnInput {
  documentRef: string;
  reason?: string;
}

export interface RedirectShipmentInput {
  documentRef: string;
  newRecipient: ShipmentAddress;
}

export interface PrintDocumentsInput {
  documentRefs: string[];
  format?: string;
}

export interface PrintDocumentsResult {
  url: string;
}

/**
 * Спільний інтерфейс усіх перевізників. Кожен метод — бізнес-операція CRM,
 * не пряма назва методу API конкретного перевізника (mapper.ts кожного
 * провайдера ховає цю різницю).
 */
export interface CarrierProvider {
  calculate(input: CalculateShipmentInput): Promise<CalculateShipmentResult>;
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  updateShipment(ref: string, input: CreateShipmentInput): Promise<ShipmentResult>;
  deleteShipment(ref: string): Promise<void>;
  track(documentNumber: string, phone?: string): Promise<TrackShipmentResult>;
  createReturn(input: CreateReturnInput): Promise<{ ref: string }>;
  redirectShipment(input: RedirectShipmentInput): Promise<{ ref: string }>;
  getCities(query: string): Promise<CarrierCity[]>;
  getWarehouses(cityRef: string, query: string): Promise<CarrierWarehouse[]>;
  getStreets(cityRef: string, query: string): Promise<CarrierStreet[]>;
  getSettlement(query: string): Promise<CarrierSettlement[]>;
  getCounterparties(): Promise<CarrierCounterparty[]>;
  printDocuments(input: PrintDocumentsInput): Promise<PrintDocumentsResult>;
}

export const CARRIER_PROVIDER_METHODS = [
  "calculate",
  "createShipment",
  "updateShipment",
  "deleteShipment",
  "track",
  "createReturn",
  "redirectShipment",
  "getCities",
  "getWarehouses",
  "getStreets",
  "getSettlement",
  "getCounterparties",
  "printDocuments",
] as const satisfies readonly (keyof CarrierProvider)[];

/** Перевізник не підтримує цю операцію взагалі (не в API, чи свідомо не додано). */
export class CarrierNotSupportedError extends Error {
  constructor(carrierKey: string, method: string) {
    super(`Перевізник "${carrierKey}" не підтримує операцію "${method}"`);
    this.name = "CarrierNotSupportedError";
  }
}

/** Операція є в API перевізника, але наш провайдер її ще не реалізував (docs/carriers/<carrier>/). */
export class CarrierNotImplementedError extends Error {
  constructor(carrierKey: string, method: string) {
    super(`Операція "${method}" перевізника "${carrierKey}" ще не реалізована`);
    this.name = "CarrierNotImplementedError";
  }
}
