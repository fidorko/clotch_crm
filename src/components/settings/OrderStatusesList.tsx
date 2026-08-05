"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DEV_USER } from "@/lib/constants/dev-user";
import type { OrderStatusRow } from "@/server/data/order-statuses";
import {
  createOrderStatusAction,
  deleteOrderStatusAction,
  updateOrderStatusAction,
} from "@/app/settings/references/order-statuses/actions";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
// Список сповіщуваних — поки єдина опція (TODO(auth), той самий підхід,
// що RESPONSIBLE_PERSON_OPTIONS у warehouse-receiving.md): реального
// переліку користувачів тенанта нема, доки нема авторизації.
const NOTIFY_USER_OPTIONS = [DEV_USER.name];
// Синтетичне значення пункту «Зняти вибір» у Select користувача — Base UI
// Select не приймає порожній рядок як value пункту (той самий трюк, що
// "__create__" у ComboboxPossibleMaterialsField, ui-kit.md).
const CLEAR_NOTIFY_USER_VALUE = "__clear__";

const SWATCH_CLASS =
  "size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-none";

function DeleteOrderStatusButton({
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
          <Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити статус ${name}`} />
        }
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити статус?</DialogTitle>
          <DialogDescription>Статус «{name}» буде видалено з довідника.</DialogDescription>
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

// Новий, ще НЕ збережений рядок — той самий патерн, що NewColorRow: зверху
// списку, порожній, реально створюється лише по blur/Enter з непорожньою
// назвою. Сповіщення (год+користувач) — не тут, налаштовується вже в
// існуючому рядку після створення (менше полів у моменті швидкого додавання).
function NewOrderStatusRow({
  onCommit,
  onCancel,
}: {
  onCommit: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#94A3B8");

  function commit() {
    const trimmed = name.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed, color);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label="Колір нового статусу"
        className={SWATCH_CLASS}
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
        placeholder="Введіть назву статусу"
      />
    </div>
  );
}

function OrderStatusRowItem({
  status,
  onDelete,
  isDeleting,
}: {
  status: OrderStatusRow;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [notifyOn, setNotifyOn] = useState(status.notifyAfterHours !== null);
  const [hours, setHours] = useState(status.notifyAfterHours !== null ? String(status.notifyAfterHours) : "");
  const [notifyUser, setNotifyUser] = useState<string>(status.notifyUser ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const swatchColor = HEX_RE.test(color) ? color : status.color;

  function save(nextName: string, nextColor: string, nextHours: number | null, nextNotifyUser: string | null) {
    setError(null);
    startSaving(async () => {
      try {
        await updateOrderStatusAction(status.id, nextName, nextColor, nextHours, nextNotifyUser);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти статус");
      }
    });
  }

  function commitColor(value: string) {
    const normalized = value.trim();
    if (!HEX_RE.test(normalized)) {
      setError("Код кольору має бути у форматі #RRGGBB");
      setColor(status.color);
      return;
    }
    setColor(normalized.toUpperCase());
    save(name, normalized, hours ? Number(hours) : null, notifyUser || null);
  }

  function commitName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(status.name);
      return;
    }
    setName(trimmed);
    save(trimmed, color, hours ? Number(hours) : null, notifyUser || null);
  }

  // Дзвіночок — кнопка-перемикач сповіщення (не лише похідне від наявності
  // годин): вимкнення одразу чистить і год, і користувача.
  function toggleNotify() {
    if (notifyOn) {
      setNotifyOn(false);
      setHours("");
      setNotifyUser("");
      save(name, color, null, null);
    } else {
      setNotifyOn(true);
    }
  }

  function commitHours() {
    const trimmed = hours.trim();
    if (!trimmed) {
      setHours("");
      save(name, color, null, notifyUser || null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Кількість годин має бути цілим додатним числом");
      setHours(status.notifyAfterHours !== null ? String(status.notifyAfterHours) : "");
      return;
    }
    // Єдина опція користувача зараз — обираємо автоматично, поки не буде
    // реального переліку (TODO(auth)).
    const nextUser = notifyUser || DEV_USER.name;
    setHours(String(parsed));
    setNotifyUser(nextUser);
    save(name, color, parsed, nextUser);
  }

  // "Зняти вибір" — прибирає лише користувача, год лишається як є (сповіщення
  // не вимикається цілком, для цього дзвіночок).
  function commitNotifyUser(value: string) {
    const nextUser = value === CLEAR_NOTIFY_USER_VALUE ? "" : value;
    setNotifyUser(nextUser);
    save(name, color, hours ? Number(hours) : null, nextUser || null);
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={swatchColor}
          onChange={(e) => commitColor(e.target.value)}
          aria-label={`Змінити колір для ${status.name}`}
          className={SWATCH_CLASS}
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
          placeholder="Назва статусу"
          disabled={isSaving}
        />
        {error && <span className="text-xs text-destructive">{error}</span>}
        <DeleteOrderStatusButton name={status.name} disabled={isDeleting} onConfirm={() => onDelete(status.id)} />
      </div>

      <div className="flex items-center gap-2 pl-12 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={toggleNotify}
          disabled={isSaving}
          aria-pressed={notifyOn}
          aria-label={notifyOn ? "Вимкнути сповіщення про зависання" : "Увімкнути сповіщення про зависання"}
          title={notifyOn ? "Вимкнути сповіщення" : "Увімкнути сповіщення"}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md p-1 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
            notifyOn ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {notifyOn ? <Bell className="size-5" /> : <BellOff className="size-5" />}
        </button>

        {notifyOn ? (
          <>
            <span>Сповістити, якщо без зміни</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onBlur={commitHours}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder="—"
              className="h-7 w-16 text-right"
              disabled={isSaving}
            />
            <span>год →</span>
            <Select value={notifyUser || ""} onValueChange={(v) => v && commitNotifyUser(v)} disabled={isSaving}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue>{() => notifyUser || "Оберіть користувача"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CLEAR_NOTIFY_USER_VALUE}>Зняти вибір</SelectItem>
                {NOTIFY_USER_OPTIONS.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <span>Сповіщення вимкнено</span>
        )}
      </div>
    </div>
  );
}

export function OrderStatusesList({ statuses }: { statuses: OrderStatusRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isAddingDraft, setIsAddingDraft] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleCommitDraft(name: string, color: string) {
    setActionError(null);
    setIsCreating(true);
    startTransition(async () => {
      try {
        await createOrderStatusAction(name, color, null, null);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося створити статус");
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
        await deleteOrderStatusAction(id);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити статус");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Пайплайн статусів замовлення — назва, колір бейджа й опційне сповіщення про «зависання».
        </p>
        <Button onClick={() => setIsAddingDraft(true)} disabled={isAddingDraft || isCreating}>
          <Plus className="size-4" />
          Додати статус
        </Button>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {isAddingDraft && (
            <NewOrderStatusRow onCommit={handleCommitDraft} onCancel={() => setIsAddingDraft(false)} />
          )}
          {statuses.map((status) => (
            <OrderStatusRowItem
              key={status.id}
              status={status}
              onDelete={handleDelete}
              isDeleting={pendingDeleteId === status.id}
            />
          ))}
          {statuses.length === 0 && !isAddingDraft && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Статусів ще немає — натисніть «Додати статус»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
