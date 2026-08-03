"use client";

import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EditableTextRow } from "@/components/ui/editable-text-row";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface WarehouseBinColumnItem {
  id: string;
  value: string;
}

/**
 * Кошик рядка колонки — попередження про кількість нащадків підтягується
 * лише при відкритті діалогу (getWarning), не заздалегідь для кожного рядка
 * списку (countStreetDescendantsAction/countRackDescendantsAction — окремий
 * запит, зайвий для рядків, які ніхто не збирається видаляти).
 */
function DeleteBinItemButton({
  label,
  onConfirm,
  getWarning,
}: {
  label: string;
  onConfirm: () => void;
  getWarning?: () => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setWarning(null);
      return;
    }
    if (!getWarning) return;
    setLoading(true);
    getWarning()
      .then(setWarning)
      .finally(() => setLoading(false));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Видалити ${label}`} />}
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити «{label}»?</DialogTitle>
          <DialogDescription>
            {loading ? "Перевірка…" : (warning ?? "Дію не можна скасувати.")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
          <DialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>
            Видалити
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Рядок одиничного додавання — довільна назва напряму в таблиці (без
 * формату/послідовності), ліворуч від чекбоксу (пряма вказівка людини).
 * Порожнє значення на blur/Enter — тихо скасовує, не створює порожній рядок.
 */
function NewBinItemRow({
  onCreate,
  onCancel,
}: {
  onCreate: (value: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function commit() {
    const trimmed = value.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    setSaving(true);
    setError(null);
    onCreate(trimmed).catch((err) => {
      setError(err instanceof Error ? err.message : "Не вдалося створити");
      setSaving(false);
    });
  }

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5">
      <Input
        autoFocus
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Назва…"
        className="h-7 font-mono text-sm"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function WarehouseBinColumn({
  title,
  onRenameTitle,
  items,
  activeId,
  onActivate,
  selectedIds,
  onToggleSelect,
  onCreateOne,
  initialFormat,
  onCreateBulk,
  onDelete,
  getDeleteWarning,
  onPrint,
  disabled,
  emptyHint,
}: {
  title: string;
  onRenameTitle: (name: string) => void;
  items: WarehouseBinColumnItem[];
  activeId?: string | null;
  onActivate?: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onCreateOne: (value: string) => Promise<void>;
  initialFormat: string;
  onCreateBulk: (format: string, count: number) => Promise<void>;
  onDelete: (id: string) => void;
  getDeleteWarning?: (id: string) => Promise<string | null>;
  onPrint: () => void;
  disabled?: boolean;
  emptyHint: string;
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [format, setFormat] = useState(initialFormat);
  const [bulkCount, setBulkCount] = useState("");
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  function handleCreateBulk() {
    const count = Number(bulkCount);
    if (!format.trim() || !count || count <= 0) return;
    setBulkPending(true);
    setBulkError(null);
    onCreateBulk(format.trim(), count)
      .then(() => setBulkCount(""))
      .catch((err) => setBulkError(err instanceof Error ? err.message : "Не вдалося створити"))
      .finally(() => setBulkPending(false));
  }

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <EditableTextRow value={title} onChange={onRenameTitle} />

        <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-2">
          <div className="flex items-center gap-2">
            <Input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={disabled}
              placeholder="Введіть назву"
              className="h-8 flex-1"
            />
            <Input
              type="number"
              min={1}
              placeholder="Кількість"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              disabled={disabled}
              className="h-8 flex-1"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || bulkPending || !format.trim() || !bulkCount || Number(bulkCount) <= 0}
            onClick={handleCreateBulk}
          >
            Створити декілька
          </Button>
          {bulkError && <span className="text-xs text-destructive">{bulkError}</span>}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || selectedIds.size === 0}
          onClick={onPrint}
        >
          <Printer className="size-4" />
          Друкувати обрані ({selectedIds.size})
        </Button>

        <div className="flex max-h-80 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
          {isAddingNew ? (
            <NewBinItemRow
              onCreate={(value) => onCreateOne(value).then(() => setIsAddingNew(false))}
              onCancel={() => setIsAddingNew(false)}
            />
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 px-2 py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
              Додати
            </button>
          )}
          {items.length === 0 && !isAddingNew ? (
            <p className="p-3 text-sm text-muted-foreground">{emptyHint}</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn("flex items-center gap-2 px-2 py-1.5", activeId === item.id && "bg-muted")}
              >
                <button
                  type="button"
                  disabled={!onActivate}
                  onClick={() => onActivate?.(item.id)}
                  className={cn(
                    "flex-1 truncate text-left font-mono text-sm text-foreground",
                    onActivate && "cursor-pointer hover:underline"
                  )}
                >
                  {item.value}
                </button>
                <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => onToggleSelect(item.id)} />
                <DeleteBinItemButton
                  label={item.value}
                  onConfirm={() => onDelete(item.id)}
                  getWarning={getDeleteWarning ? () => getDeleteWarning(item.id) : undefined}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
