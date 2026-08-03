"use client";

import { useState } from "react";
import { WarehouseBinColumn } from "@/components/settings/WarehouseBinColumn";
import {
  countRackDescendantsAction,
  countStreetDescendantsAction,
  createCellSingleAction,
  createCellsAction,
  createRackSingleAction,
  createRacksAction,
  createStreetSingleAction,
  createStreetsAction,
  deleteCellAction,
  deleteRackAction,
  deleteStreetAction,
  listCellsAction,
  listRacksAction,
  updateBinLevelNameAction,
} from "@/app/settings/warehouses/bin-locations-actions";
import type {
  WarehouseBinCellRow,
  WarehouseBinRackRow,
  WarehouseBinStreetRow,
} from "@/server/data/warehouse-bin-locations";
import type { WarehouseRow } from "@/server/data/warehouses";

function toggleSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function removeFromSet(set: Set<string>, id: string): Set<string> {
  if (!set.has(id)) return set;
  const next = new Set(set);
  next.delete(id);
  return next;
}

async function printBinLabels(
  warehouseId: string,
  selection: { streetIds: string[]; rackIds: string[]; cellIds: string[] }
): Promise<void> {
  const res = await fetch(`/api/warehouses/${warehouseId}/bin-print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection),
  });
  if (!res.ok) throw new Error("Не вдалося сформувати PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export function WarehouseBinExplorer({
  warehouse,
  initialStreets,
  disabled,
}: {
  warehouse: WarehouseRow;
  initialStreets: WarehouseBinStreetRow[];
  disabled: boolean;
}) {
  const warehouseId = warehouse.id;

  const [level1Name, setLevel1Name] = useState(warehouse.binLevel1Name);
  const [level2Name, setLevel2Name] = useState(warehouse.binLevel2Name);
  const [level3Name, setLevel3Name] = useState(warehouse.binLevel3Name);

  const [streets, setStreets] = useState(initialStreets);
  const [selectedStreetIds, setSelectedStreetIds] = useState<Set<string>>(new Set());
  const [activeStreetId, setActiveStreetId] = useState<string | null>(null);

  const [racks, setRacks] = useState<WarehouseBinRackRow[]>([]);
  const [selectedRackIds, setSelectedRackIds] = useState<Set<string>>(new Set());
  const [activeRackId, setActiveRackId] = useState<string | null>(null);
  const [racksLoading, setRacksLoading] = useState(false);

  const [cells, setCells] = useState<WarehouseBinCellRow[]>([]);
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
  const [cellsLoading, setCellsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  function renameLevel(level: 1 | 2 | 3, name: string) {
    if (level === 1) setLevel1Name(name);
    else if (level === 2) setLevel2Name(name);
    else setLevel3Name(name);
    updateBinLevelNameAction(warehouseId, level, name).catch((err) => {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти назву");
    });
  }

  function activateStreet(id: string) {
    setActiveStreetId(id);
    setActiveRackId(null);
    setRacks([]);
    setCells([]);
    setSelectedRackIds(new Set());
    setSelectedCellIds(new Set());
    setRacksLoading(true);
    listRacksAction(id)
      .then(setRacks)
      .catch((err) => setError(err instanceof Error ? err.message : "Не вдалося завантажити стелажі"))
      .finally(() => setRacksLoading(false));
  }

  function activateRack(id: string) {
    setActiveRackId(id);
    setCells([]);
    setSelectedCellIds(new Set());
    setCellsLoading(true);
    listCellsAction(id)
      .then(setCells)
      .catch((err) => setError(err instanceof Error ? err.message : "Не вдалося завантажити комірки"))
      .finally(() => setCellsLoading(false));
  }

  async function handleCreateStreetSingle(value: string) {
    setError(null);
    const created = await createStreetSingleAction(warehouseId, value);
    setStreets((prev) => [...prev, created]);
  }

  async function handleCreateStreetsBulk(format: string, count: number) {
    setError(null);
    const created = await createStreetsAction(warehouseId, format, count);
    setStreets((prev) => [...prev, ...created]);
  }

  async function handleCreateRackSingle(value: string) {
    if (!activeStreetId) return;
    setError(null);
    const created = await createRackSingleAction(warehouseId, activeStreetId, value);
    setRacks((prev) => [...prev, created]);
  }

  async function handleCreateRacksBulk(format: string, count: number) {
    if (!activeStreetId) return;
    setError(null);
    const created = await createRacksAction(warehouseId, activeStreetId, format, count);
    setRacks((prev) => [...prev, ...created]);
  }

  async function handleCreateCellSingle(value: string) {
    if (!activeRackId) return;
    setError(null);
    const created = await createCellSingleAction(warehouseId, activeRackId, value);
    setCells((prev) => [...prev, created]);
  }

  async function handleCreateCellsBulk(format: string, count: number) {
    if (!activeRackId) return;
    setError(null);
    const created = await createCellsAction(warehouseId, activeRackId, format, count);
    setCells((prev) => [...prev, ...created]);
  }

  async function handleDeleteStreet(id: string) {
    setError(null);
    try {
      await deleteStreetAction(warehouseId, id);
      setStreets((prev) => prev.filter((s) => s.id !== id));
      setSelectedStreetIds((prev) => removeFromSet(prev, id));
      if (activeStreetId === id) {
        setActiveStreetId(null);
        setActiveRackId(null);
        setRacks([]);
        setCells([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити вулицю");
    }
  }

  async function handleDeleteRack(id: string) {
    setError(null);
    try {
      await deleteRackAction(warehouseId, id);
      setRacks((prev) => prev.filter((r) => r.id !== id));
      setSelectedRackIds((prev) => removeFromSet(prev, id));
      if (activeRackId === id) {
        setActiveRackId(null);
        setCells([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити стелаж");
    }
  }

  async function handleDeleteCell(id: string) {
    setError(null);
    try {
      await deleteCellAction(warehouseId, id);
      setCells((prev) => prev.filter((c) => c.id !== id));
      setSelectedCellIds((prev) => removeFromSet(prev, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити комірку");
    }
  }

  async function handlePrint(selection: { streetIds: string[]; rackIds: string[]; cellIds: string[] }) {
    setError(null);
    try {
      await printBinLabels(warehouseId, selection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося сформувати PDF");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">Структура комірок</h2>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WarehouseBinColumn
          title={level1Name}
          onRenameTitle={(name) => renameLevel(1, name)}
          items={streets}
          activeId={activeStreetId}
          onActivate={activateStreet}
          selectedIds={selectedStreetIds}
          onToggleSelect={(id) => setSelectedStreetIds((prev) => toggleSet(prev, id))}
          onCreateOne={handleCreateStreetSingle}
          initialFormat={warehouse.binLevel1Format}
          onCreateBulk={handleCreateStreetsBulk}
          onDelete={handleDeleteStreet}
          getDeleteWarning={async (id) => {
            const { racks: rackCount, cells: cellCount } = await countStreetDescendantsAction(id);
            return rackCount > 0 || cellCount > 0
              ? `Буде видалено ${rackCount} стелажів і ${cellCount} комірок.`
              : null;
          }}
          onPrint={() => handlePrint({ streetIds: [...selectedStreetIds], rackIds: [], cellIds: [] })}
          disabled={disabled}
          emptyHint="Ще немає жодної вулиці"
        />
        <WarehouseBinColumn
          title={level2Name}
          onRenameTitle={(name) => renameLevel(2, name)}
          items={racks}
          activeId={activeRackId}
          onActivate={activateRack}
          selectedIds={selectedRackIds}
          onToggleSelect={(id) => setSelectedRackIds((prev) => toggleSet(prev, id))}
          onCreateOne={handleCreateRackSingle}
          initialFormat={warehouse.binLevel2Format}
          onCreateBulk={handleCreateRacksBulk}
          onDelete={handleDeleteRack}
          getDeleteWarning={async (id) => {
            const { cells: cellCount } = await countRackDescendantsAction(id);
            return cellCount > 0 ? `Буде видалено ${cellCount} комірок.` : null;
          }}
          onPrint={() => handlePrint({ streetIds: [], rackIds: [...selectedRackIds], cellIds: [] })}
          disabled={disabled || !activeStreetId}
          emptyHint={
            !activeStreetId ? "Оберіть вулицю зліва" : racksLoading ? "Завантаження…" : "Ще немає жодного стелажа"
          }
        />
        <WarehouseBinColumn
          title={level3Name}
          onRenameTitle={(name) => renameLevel(3, name)}
          items={cells}
          selectedIds={selectedCellIds}
          onToggleSelect={(id) => setSelectedCellIds((prev) => toggleSet(prev, id))}
          onCreateOne={handleCreateCellSingle}
          initialFormat={warehouse.binLevel3Format}
          onCreateBulk={handleCreateCellsBulk}
          onDelete={handleDeleteCell}
          onPrint={() => handlePrint({ streetIds: [], rackIds: [], cellIds: [...selectedCellIds] })}
          disabled={disabled || !activeRackId}
          emptyHint={
            !activeRackId ? "Оберіть стелаж посередині" : cellsLoading ? "Завантаження…" : "Ще немає жодної комірки"
          }
        />
      </div>
    </div>
  );
}
