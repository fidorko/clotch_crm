"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import type { ColorRow } from "@/server/data/colors";
import { createColorAction, deleteColorAction, updateColorAction } from "@/app/settings/references/colors/actions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Знімає webkit/moz внутрішні відступ+рамку в <input type="color">, щоб він виглядав
// чистим квадратиком-зразком кольору; клік по ньому відкриває нативний спектр браузера.
const SWATCH_CLASS =
  "size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none";

function DeleteColorButton({
  name,
  onConfirm,
  disabled,
}: {
  name: string;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити колір ${name}`} />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити колір?</DialogTitle>
          <DialogDescription>
            Колір «{name}» буде видалено з довідника. Товари, де він уже використаний у SKU,
            збережуть назву й код кольору як текст — це їх не зачепить.
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
 * Новий, ще НЕ збережений рядок — з'являється зверху списку, порожній, з
 * підказкою «Введіть назву» (за прямою вказівкою людини — той самий патерн,
 * що NewMaterialRow у MaterialsManager). Реально створюється (createColorAction)
 * лише по blur/Enter з непорожньою назвою — інакше два швидкі кліки «Додати»
 * до вводу назви конфліктували б на UNIQUE(tenant_id, name) з порожнім рядком.
 */
function NewColorRow({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string, hex: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#CCCCCC");

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed, hex);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input
        type="color"
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        aria-label="Колір-зразок нового кольору"
        className={SWATCH_CLASS}
      />
      <Input
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        maxLength={7}
        className="h-8 w-24 font-mono text-xs uppercase"
      />
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") onCancel();
        }}
        className="h-8 flex-1"
        placeholder="Введіть назву"
      />
    </div>
  );
}

function ColorRowItem({
  color,
  onDelete,
  isDeleting,
}: {
  color: ColorRow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const swatchHex = HEX_RE.test(hex) ? hex : color.hex;

  function save(nextName: string, nextHex: string) {
    if (nextName === color.name && nextHex.toUpperCase() === color.hex.toUpperCase()) return;
    setError(null);
    startSaving(async () => {
      try {
        await updateColorAction(color.id, nextName, nextHex);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти колір");
      }
    });
  }

  function commitHex(value: string) {
    const normalized = value.trim();
    if (!HEX_RE.test(normalized)) {
      setError("Код кольору має бути у форматі #RRGGBB");
      setHex(color.hex);
      return;
    }
    setHex(normalized.toUpperCase());
    save(name, normalized);
  }

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(color.name);
      return;
    }
    setName(trimmed);
    save(trimmed, hex);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input
        type="color"
        value={swatchHex}
        onChange={(e) => commitHex(e.target.value)}
        aria-label={`Змінити колір для ${color.name}`}
        className={SWATCH_CLASS}
        disabled={isSaving}
      />
      <Input
        value={hex}
        onChange={(e) => setHex(e.target.value)}
        onBlur={(e) => commitHex(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        maxLength={7}
        className="h-8 w-24 font-mono text-xs uppercase"
        disabled={isSaving}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 flex-1"
        placeholder="Назва кольору"
        disabled={isSaving}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
      <DeleteColorButton name={color.name} disabled={isDeleting} onConfirm={() => onDelete(color.id)} />
    </div>
  );
}

export function ColorsList({ colors }: { colors: ColorRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isAddingDraft, setIsAddingDraft] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCommitDraft(name: string, hex: string) {
    setActionError(null);
    setIsCreating(true);
    startTransition(async () => {
      try {
        await createColorAction(name, hex);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити колір");
      } finally {
        setIsCreating(false);
        setIsAddingDraft(false);
      }
    });
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await deleteColorAction(id);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити колір");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Довідник кольорів — використовується в конструкторі SKU на картці товару.
        </p>
        <Button onClick={() => setIsAddingDraft(true)} disabled={isAddingDraft || isCreating}>
          <Plus className="size-4" />
          Додати колір
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {isAddingDraft && (
            <NewColorRow onCommit={handleCommitDraft} onCancel={() => setIsAddingDraft(false)} />
          )}
          {colors.map((color) => (
            <ColorRowItem
              key={color.id}
              color={color}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === color.id}
            />
          ))}
          {colors.length === 0 && !isAddingDraft && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Кольорів ще немає — натисніть «Додати колір»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
