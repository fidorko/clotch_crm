// Сирі форми відповідей API (PascalCase — так, як повертає Нова пошта,
// docs/carriers/novaposhta/reference-data.md) — mapper.ts перетворює їх у
// доменні типи carrier.interface.ts. Розділено навмисно: зміна поля в API
// Нової пошти означає правку лише тут + у mapper.ts, не в решті CRM.

export interface NpCityRaw {
  Ref: string;
  Description: string;
}

export interface NpWarehouseRaw {
  Ref: string;
  Description: string;
  ShortAddress: string;
  CityRef: string;
  TypeOfWarehouse: string;
}

export interface NpStreetRaw {
  Ref: string;
  Description: string;
  StreetsType: string;
}

export interface NpCounterpartyRaw {
  Ref: string;
  Description: string;
  CounterpartyType: string;
}

export interface NpContactPersonRaw {
  Ref: string;
  Description: string;
  Phones: string;
}

export interface NpPackItemRaw {
  Ref: string;
  Description: string;
  Length: string;
  Width: string;
  Height: string;
}

export interface NpServiceTypeRaw {
  Ref: string;
  Description: string;
}

export interface NpPayerTypeRaw {
  Ref: string;
  Description: string;
}
