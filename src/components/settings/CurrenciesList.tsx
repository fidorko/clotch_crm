"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import { CurrencyFormDialog } from "@/components/settings/CurrencyFormDialog";
import type { CurrencyRow } from "@/server/data/currencies";
import {
  deleteCurrencyAction,
  refreshAllCurrencyRatesAction,
  refreshCurrencyRateAction,
} from "@/app/settings/references/currencies/actions";

function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatRate(value: string | null): string {
  if (!value) return "—";
  return Number(value).toLocaleString("uk-UA", { maximumFractionDigits: 4 });
}

export function CurrenciesList({ currencies }: { currencies: CurrencyRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleDelete(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteCurrencyAction(id);
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося видалити валюту");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRefreshRate(id: string) {
    setActionError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await refreshCurrencyRateAction(id);
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося оновити курс");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRefreshAll() {
    setActionError(null);
    setActionNotice(null);
    setIsRefreshingAll(true);
    startTransition(async () => {
      try {
        const { updated, failed } = await refreshAllCurrencyRatesAction();
        setActionNotice(
          failed.length === 0
            ? `Оновлено курсів: ${updated}`
            : `Оновлено: ${updated}. Не вдалося: ${failed.join(", ")}`
        );
        refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Не вдалося оновити курси");
      } finally {
        setIsRefreshingAll(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Валюти магазину — використовуються в цінах товару. Курси нерідних валют — з НБУ.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={isRefreshingAll}>
            <RefreshCw className="size-4" />
            Оновити курси
          </Button>
          <CurrencyFormDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                Додати валюту
              </Button>
            }
            onSaved={refresh}
          />
        </div>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {actionNotice && <p className="text-sm text-muted-foreground">{actionNotice}</p>}

      <Card className="gap-0 py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Код</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Символ</TableHead>
                <TableHead className="text-right">Курс</TableHead>
                <TableHead>Оновлено</TableHead>
                <TableHead>Автооновлення</TableHead>
                <TableHead>За замовчуванням</TableHead>
                <TableHead>Активна</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => {
                const isRowPending = pendingId === currency.id;
                return (
                  <TableRow key={currency.id}>
                    <TableCell className="font-mono text-sm">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell>{currency.symbol || "—"}</TableCell>
                    <TableCell className="text-right">
                      {currency.isDefault ? "—" : formatRate(currency.exchangeRate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {currency.isDefault ? "—" : formatDate(currency.rateUpdatedAt)}
                    </TableCell>
                    <TableCell>
                      {currency.isDefault ? (
                        "—"
                      ) : (
                        <Badge variant={currency.autoUpdate ? "success" : "secondary"}>
                          {currency.autoUpdate ? "Так" : "Ні"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {currency.isDefault ? <Badge variant="default">Базова</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={currency.isActive ? "success" : "secondary"}>
                        {currency.isActive ? "Активна" : "Прихована"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {!currency.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isRowPending}
                            onClick={() => handleRefreshRate(currency.id)}
                            aria-label={`Оновити курс ${currency.code} з НБУ`}
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        )}
                        <CurrencyFormDialog
                          currency={currency}
                          onSaved={refresh}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Редагувати валюту ${currency.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDeleteIconButton
                          ariaLabel={`Видалити валюту ${currency.name}`}
                          title="Видалити валюту?"
                          description={
                            currency.isDefault
                              ? `«${currency.name}» — базова валюта, спочатку призначте іншу базовою.`
                              : `«${currency.name}» (${currency.code}) буде видалено безповоротно.`
                          }
                          onConfirm={() => handleDelete(currency.id)}
                          className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {currencies.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Валют ще немає — натисніть «Додати валюту»
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
