import type { BinSeparator } from "@/lib/warehouse/bin-address";

export interface WarehouseBinConfigInput {
  level1Name: string;
  level2Name: string;
  level3Name: string;
  level1Format: string;
  level2Format: string;
  level3Format: string;
  separator: BinSeparator;
  generateBarcodes: boolean;
  generateQr: boolean;
  allowLabelReprint: boolean;
  streetsCount: number | null;
  racksPerStreet: number | null;
  cellsPerRack: number | null;
}

export interface WarehouseBinGenerationPreview {
  totalRequested: number;
  existingTotal: number;
  alreadyMatching: number;
  willCreateNew: number;
}
