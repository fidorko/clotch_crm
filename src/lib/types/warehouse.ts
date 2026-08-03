import type { WarehouseType } from "@/lib/constants/warehouse-options";

export interface WarehouseWorkHourInput {
  id: string;
  label: string;
  isDayOff: boolean;
  from: string;
  to: string;
}

export interface WarehouseFormInput {
  name: string;
  type: WarehouseType;
  isActive: boolean;
  responsiblePerson: string;
  responsiblePhone: string;
  country: string;
  city: string;
  address: string;
  notes: string;
  workHours: WarehouseWorkHourInput[];
  currencyCode: string;
  canSell: boolean;
  allowNegativeStock: boolean;
  useBinLocations: boolean;
}
