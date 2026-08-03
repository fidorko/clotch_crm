"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { WarehouseBinLabelPreview } from "@/components/settings/WarehouseBinLabelPreview";
import { WarehouseBinGenerationWizard } from "@/components/settings/WarehouseBinGenerationWizard";
import { BIN_SEPARATOR_OPTIONS } from "@/lib/constants/warehouse-bin-options";
import { binGeneratorTotal, generateBinCombinations, type BinSeparator } from "@/lib/warehouse/bin-address";
import type { WarehouseBinConfigInput } from "@/lib/types/warehouse-bin";
import type { WarehouseRow } from "@/server/data/warehouses";
import { updateWarehouseBinConfigAction } from "@/app/settings/warehouses/bin-locations-actions";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS_LIMIT = 6;

function pluralizeCells(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "комірка";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "комірки";
  return "комірок";
}

export function WarehouseBinLocationsTab({
  warehouse,
  useBinLocations,
  onUseBinLocationsChange,
}: {
  warehouse: WarehouseRow;
  useBinLocations: boolean;
  onUseBinLocationsChange: (value: boolean) => void;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const [level1Name, setLevel1Name] = useState(warehouse.binLevel1Name);
  const [level2Name, setLevel2Name] = useState(warehouse.binLevel2Name);
  const [level3Name, setLevel3Name] = useState(warehouse.binLevel3Name);
  const [level1Format, setLevel1Format] = useState(warehouse.binLevel1Format);
  const [level2Format, setLevel2Format] = useState(warehouse.binLevel2Format);
  const [level3Format, setLevel3Format] = useState(warehouse.binLevel3Format);
  const [separator, setSeparator] = useState<BinSeparator>(warehouse.binSeparator);
  const [generateBarcodes, setGenerateBarcodes] = useState(warehouse.binGenerateBarcodes);
  const [generateQr, setGenerateQr] = useState(warehouse.binGenerateQr);
  const [allowLabelReprint, setAllowLabelReprint] = useState(warehouse.binAllowLabelReprint);
  const [streetsCount, setStreetsCount] = useState(warehouse.binStreetsCount?.toString() ?? "");
  const [racksPerStreet, setRacksPerStreet] = useState(warehouse.binRacksPerStreet?.toString() ?? "");
  const [cellsPerRack, setCellsPerRack] = useState(warehouse.binCellsPerRack?.toString() ?? "");

  const streets = Number(streetsCount) || 0;
  const racks = Number(racksPerStreet) || 0;
  const cells = Number(cellsPerRack) || 0;
  const generatorFilled = streetsCount !== "" && racksPerStreet !== "" && cellsPerRack !== "" && streets > 0 && racks > 0 && cells > 0;
  const total = binGeneratorTotal({ streetsCount: streets, racksPerStreet: racks, cellsPerRack: cells });

  const generatorParams = useMemo(
    () => ({
      level1Format,
      level2Format,
      level3Format,
      separator,
      streetsCount: streets,
      racksPerStreet: racks,
      cellsPerRack: cells,
    }),
    [level1Format, level2Format, level3Format, separator, streets, racks, cells]
  );

  const previewRows = useMemo(
    () => (generatorFilled ? generateBinCombinations(generatorParams, PREVIEW_ROWS_LIMIT) : []),
    [generatorFilled, generatorParams]
  );

  function buildConfig(): WarehouseBinConfigInput {
    return {
      level1Name,
      level2Name,
      level3Name,
      level1Format,
      level2Format,
      level3Format,
      separator,
      generateBarcodes,
      generateQr,
      allowLabelReprint,
      streetsCount: streets || null,
      racksPerStreet: racks || null,
      cellsPerRack: cells || null,
    };
  }

  function resetToSaved() {
    setLevel1Name(warehouse.binLevel1Name);
    setLevel2Name(warehouse.binLevel2Name);
    setLevel3Name(warehouse.binLevel3Name);
    setLevel1Format(warehouse.binLevel1Format);
    setLevel2Format(warehouse.binLevel2Format);
    setLevel3Format(warehouse.binLevel3Format);
    setSeparator(warehouse.binSeparator);
    setGenerateBarcodes(warehouse.binGenerateBarcodes);
    setGenerateQr(warehouse.binGenerateQr);
    setAllowLabelReprint(warehouse.binAllowLabelReprint);
    setStreetsCount(warehouse.binStreetsCount?.toString() ?? "");
    setRacksPerStreet(warehouse.binRacksPerStreet?.toString() ?? "");
    setCellsPerRack(warehouse.binCellsPerRack?.toString() ?? "");
    setError(null);
    setSaveMessage(null);
  }

  function saveConfig(): Promise<void> {
    setError(null);
    setSaveMessage(null);
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          await updateWarehouseBinConfigAction(warehouse.id, buildConfig());
          setSaveMessage("Збережено");
          router.refresh();
          resolve();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Не вдалося зберегти";
          setError(message);
          reject(new Error(message));
        }
      });
    });
  }

  function handleSaveAndGenerate() {
    saveConfig()
      .then(() => setWizardOpen(true))
      .catch(() => {
        /* помилка вже показана через error-стан */
      });
  }

  const disabledSection = cn(!useBinLocations && "pointer-events-none opacity-40");

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card className="gap-0 py-4">
        <CardContent className="flex flex-col gap-4 px-4">
          <h2 className="text-sm font-semibold text-foreground">Адресне зберігання</h2>

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">Використовувати адресне зберігання</span>
            <Switch checked={useBinLocations} onCheckedChange={onUseBinLocationsChange} />
          </label>

          <div className={cn("flex flex-col gap-3 border-t border-border pt-3", disabledSection)}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={generateBarcodes} onCheckedChange={(v) => setGenerateBarcodes(v === true)} />
              Автоматично генерувати штрихкоди комірок
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={generateQr} onCheckedChange={(v) => setGenerateQr(v === true)} />
              Створити QR-коди
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={allowLabelReprint} onCheckedChange={(v) => setAllowLabelReprint(v === true)} />
              Дозволити повторний друк етикеток
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("gap-0 py-4", disabledSection)}>
        <CardContent className="flex flex-col gap-4 px-4">
          <h2 className="text-sm font-semibold text-foreground">Структура адрес</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Назва першого рівня</label>
              <Input value={level1Name} onChange={(e) => setLevel1Name(e.target.value)} placeholder="Вулиця" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Назва другого рівня</label>
              <Input value={level2Name} onChange={(e) => setLevel2Name(e.target.value)} placeholder="Стелаж" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Назва третього рівня</label>
              <Input value={level3Name} onChange={(e) => setLevel3Name(e.target.value)} placeholder="Комірка" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Формат номера вулиці</label>
              <Input value={level1Format} onChange={(e) => setLevel1Format(e.target.value)} placeholder="101" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Формат стелажа</label>
              <Input value={level2Format} onChange={(e) => setLevel2Format(e.target.value)} placeholder="A" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Формат комірки</label>
              <Input value={level3Format} onChange={(e) => setLevel3Format(e.target.value)} placeholder="01" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 lg:w-1/3">
            <label className="text-sm text-muted-foreground">Роздільник адреси</label>
            <Select value={separator} onValueChange={(v) => v && setSeparator(v as BinSeparator)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => BIN_SEPARATOR_OPTIONS.find((o) => o.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BIN_SEPARATOR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("gap-0 py-4", disabledSection)}>
        <CardContent className="flex flex-col gap-4 px-4">
          <h2 className="text-sm font-semibold text-foreground">Генератор комірок</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Кількість вулиць</label>
              <Input
                type="number"
                min={1}
                value={streetsCount}
                onChange={(e) => setStreetsCount(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Стелажів на вулицю</label>
              <Input
                type="number"
                min={1}
                value={racksPerStreet}
                onChange={(e) => setRacksPerStreet(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Комірок на стелаж</label>
              <Input
                type="number"
                min={1}
                value={cellsPerRack}
                onChange={(e) => setCellsPerRack(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Буде створено: <span className="font-semibold text-foreground">{total} {pluralizeCells(total)}</span>
            </AlertDescription>
          </Alert>

          <Button
            type="button"
            variant="outline"
            className="self-start"
            disabled={!generatorFilled}
            onClick={() => setWizardOpen(true)}
          >
            Згенерувати структуру
          </Button>
        </CardContent>
      </Card>

      <Card className={cn("gap-0 py-4", disabledSection)}>
        <CardContent className="flex flex-col gap-4 px-4">
          <h2 className="text-sm font-semibold text-foreground">Попередній перегляд</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Table>
              <TableBody>
                {previewRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="text-sm text-muted-foreground">
                      Заповніть генератор комірок, щоб побачити приклад адрес
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {previewRows.map((row) => (
                      <TableRow key={row.code} className="hover:bg-transparent">
                        <TableCell className="font-mono text-sm">{row.code}</TableCell>
                      </TableRow>
                    ))}
                    {total > PREVIEW_ROWS_LIMIT && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="text-sm text-muted-foreground">…</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>

            <WarehouseBinLabelPreview
              code={previewRows[0]?.code ?? "101 A 01"}
              showBarcode={generateBarcodes}
              showQr={generateQr}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 pt-2">
        {error && <span className="mr-auto text-sm text-destructive">{error}</span>}
        {!error && saveMessage && <span className="mr-auto text-sm text-muted-foreground">{saveMessage}</span>}
        <Button type="button" variant="outline" onClick={resetToSaved} disabled={isSaving}>
          Скасувати
        </Button>
        <Button type="button" variant="outline" onClick={() => saveConfig()} disabled={isSaving}>
          Зберегти
        </Button>
        <Button type="button" onClick={handleSaveAndGenerate} disabled={isSaving || !generatorFilled}>
          Зберегти та згенерувати структуру
        </Button>
      </div>

      <WarehouseBinGenerationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        warehouseId={warehouse.id}
        params={generatorParams}
        generateBarcodes={generateBarcodes}
        generateQr={generateQr}
      />
    </div>
  );
}
