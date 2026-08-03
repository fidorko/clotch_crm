// Вибір для друку етикеток (WarehouseBinExplorer) — id вулиць/стелажів/комірок,
// відмічені чекбоксом у відповідній колонці. Вулиця/стелаж означають "усе, що
// нижче" (resolveCellsForPrint у server/data/warehouse-bin-locations.ts).
export interface BinPrintSelection {
  streetIds: string[];
  rackIds: string[];
  cellIds: string[];
}
