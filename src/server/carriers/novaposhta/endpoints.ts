// Централізовані назви модель/метод API Нової пошти (docs/carriers/novaposhta/overview.md).
// НЕ "Reference" для довідників — реальний modelName "CommonGeneral"
// (перевірено живим викликом, "Reference" повертає success:false,
// warnings: ["Model is invalid"] — легко наступити на ті самі граблі
// повторно, тому винесено в один файл-константу, не розкидано по коду).
export const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

export const NP_MODEL = {
  address: "Address",
  counterparty: "Counterparty",
  commonGeneral: "CommonGeneral",
  internetDocument: "InternetDocument",
  trackingDocument: "TrackingDocument",
} as const;

export const NP_METHOD = {
  getCities: "getCities",
  getWarehouses: "getWarehouses",
  // Однина! "getStreets" не існує (Method AddressGeneral_getStreets not found,
  // перевірено живим викликом 2026-08-06) — та сама гочка, що Reference/CommonGeneral.
  getStreet: "getStreet",
  getCounterparties: "getCounterparties",
  getCounterpartyContactPersons: "getCounterpartyContactPersons",
  getPackList: "getPackList",
  getServiceTypes: "getServiceTypes",
  getTypesOfPayers: "getTypesOfPayers",
  save: "save",
} as const;
