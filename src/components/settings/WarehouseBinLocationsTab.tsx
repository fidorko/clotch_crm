"use client";

import { WarehouseBinExplorer } from "@/components/settings/WarehouseBinExplorer";
import type { WarehouseRow } from "@/server/data/warehouses";
import type { WarehouseBinStreetRow } from "@/server/data/warehouse-bin-locations";
import { cn } from "@/lib/utils";

export function WarehouseBinLocationsTab({
  warehouse,
  initialStreets,
  useBinLocations,
}: {
  warehouse: WarehouseRow;
  initialStreets: WarehouseBinStreetRow[];
  useBinLocations: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-6">
      {!useBinLocations && (
        <p className="text-sm text-muted-foreground">
          Увімкніть «Застосовувати адресне зберігання» на вкладці «Основні налаштування», щоб редагувати структуру.
        </p>
      )}
      <div className={cn(!useBinLocations && "pointer-events-none opacity-40")}>
        <WarehouseBinExplorer warehouse={warehouse} initialStreets={initialStreets} disabled={!useBinLocations} />
      </div>
    </div>
  );
}
