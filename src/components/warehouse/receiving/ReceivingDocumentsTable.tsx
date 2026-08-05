"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Download, PackageCheck, Printer, Search, Trash2, Truck, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { parseUaDate } from "@/lib/date-ua";
import {
  RECEIVING_DOC_STATUS_META,
  receivingDocTypeLabel,
  type ReceivingDocStatus,
  type ReceivingDocumentListItem,
} from "@/lib/types/receiving";
import { acceptPlannedReceivingAction, deleteReceivingDocumentAction } from "@/app/warehouse/receiving/actions";

const STATUS_FILTER_OPTIONS: { value: ReceivingDocStatus | "all"; label: string }[] = [
  { value: "all", label: "Усі статуси" },
  ...(Object.entries(RECEIVING_DOC_STATUS_META) as [ReceivingDocStatus, { label: string }][]).map(
    ([value, meta]) => ({ value, label: meta.label })
  ),
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

// Копіювати/Друк/Експорт — заглушки (нема бекенду під них). Видалення —
// реальне для будь-якого статусу (пряма вказівка людини); сервер попутно
// відкочує product_skus.stock за прийнятими позиціями (server/data/receiving.ts).
// «Прийняти на склад» — знову в списку (повернено за прямою вказівкою
// людини), лише для планового в стані «Очікується поставка».
function RowActions({ doc }: { doc: ReceivingDocumentListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteReceivingDocumentAction(doc.id);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Не вдалося видалити документ");
      }
    });
  }

  function handleAccept() {
    startTransition(async () => {
      await acceptPlannedReceivingAction(doc.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label={`Копіювати документ ${doc.number}`}>
        <Copy className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Друк документа ${doc.number}`}>
        <Printer className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={`Експорт документа ${doc.number}`}>
        <Download className="size-4" />
      </Button>
      {doc.isPlanned && doc.status === "awaiting_delivery" && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          aria-label={`Прийняти на склад — ${doc.number}`}
          onClick={handleAccept}
        >
          <PackageCheck className="size-4" />
        </Button>
      )}
      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              aria-label={`Видалити документ ${doc.number}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            />
          }
        >
          <Trash2 className="size-4" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити документ?</DialogTitle>
            <DialogDescription>
              {`Надходження «${doc.number}» буде видалено остаточно. Прийнята кількість (якщо була) буде списана зі складського залишку.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
            <DialogClose render={<Button type="button" variant="destructive" onClick={handleDelete} />}>
              Видалити
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// «Виконання» — лише для планового (є з чим порівнювати «Прийнято»):
// прогрес-смуга + дріб received/ordered, зелена коли зібрано повністю,
// жовта коли частково, сіра поки нічого не прийнято. Для фактичного —
// просто кількість прийнятого, без смуги (нема плану для порівняння).
function ExecutionCell({ doc }: { doc: ReceivingDocumentListItem }) {
  if (!doc.isPlanned) {
    return <span className="text-muted-foreground">{doc.totalReceived ? `${doc.totalReceived} прийнято` : "—"}</span>;
  }

  const ratio = doc.totalOrdered > 0 ? Math.min(1, doc.totalReceived / doc.totalOrdered) : 0;
  const tone =
    doc.totalReceived > 0 && doc.totalReceived >= doc.totalOrdered
      ? "bg-success"
      : doc.totalReceived > 0
        ? "bg-warning"
        : "bg-muted-foreground/30";

  return (
    <div className="flex w-28 flex-col gap-1">
      <span className="text-xs text-muted-foreground">
        {doc.totalReceived}/{doc.totalOrdered}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: ReceivingDocumentListItem }) {
  const statusMeta = RECEIVING_DOC_STATUS_META[doc.status];
  const TypeIcon = doc.isPlanned ? Truck : Warehouse;

  return (
    <TableRow>
      <TableCell className="font-medium text-foreground">
        <Link href={`/warehouse/receiving/${doc.id}`} className="flex items-center gap-2.5 hover:underline">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              doc.isPlanned ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
            )}
          >
            <TypeIcon className="size-4.5" />
          </span>
          <span className="flex flex-col">
            {doc.number}
            <span className="text-xs font-normal text-muted-foreground">
              {receivingDocTypeLabel(doc.isPlanned)} надходження
            </span>
          </span>
        </Link>
      </TableCell>
      <TableCell>{doc.supplier ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{doc.date ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("border-transparent", statusMeta.className)}>
          {statusMeta.label}
        </Badge>
      </TableCell>
      <TableCell>
        <ExecutionCell doc={doc} />
      </TableCell>
      <TableCell className="text-muted-foreground">{doc.supplierDocument || "—"}</TableCell>
      <TableCell>
        <RowActions doc={doc} />
      </TableCell>
    </TableRow>
  );
}

export function ReceivingDocumentsTable({ documents }: { documents: ReceivingDocumentListItem[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [search, setSearch] = useState("");
  const [supplierDocument, setSupplierDocument] = useState("");
  const [status, setStatus] = useState<ReceivingDocStatus | "all">("all");

  const supplierOptions = Array.from(
    new Set(documents.map((d) => d.supplier).filter((s): s is string => Boolean(s)))
  );

  const filtered = documents.filter((doc) => {
    if (supplier !== "all" && doc.supplier !== supplier) return false;
    if (status !== "all" && doc.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (q && !doc.number.toLowerCase().includes(q) && !doc.itemsSearchText.includes(q)) return false;
    if (
      supplierDocument &&
      !(doc.supplierDocument ?? "").toLowerCase().includes(supplierDocument.toLowerCase())
    )
      return false;

    const docDate = doc.date ? parseUaDate(doc.date) : null;
    const from = dateFrom.length === 10 ? parseUaDate(dateFrom) : null;
    const to = dateTo.length === 10 ? parseUaDate(dateTo) : null;
    if (from && docDate && docDate < from) return false;
    if (to && docDate && docDate > to) return false;

    return true;
  });

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y divide-border px-0">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Пошук</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Номер, товар, SKU або ШК"
                className="w-[28rem] pl-8"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Дата від</FieldLabel>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Будь-яка" className="w-36" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Дата до</FieldLabel>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="Будь-яка" className="w-36" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Постачальник</FieldLabel>
            <Select value={supplier} onValueChange={(v) => setSupplier(v ?? "all")}>
              <SelectTrigger className="w-48">
                <SelectValue>{(v: string) => (v === "all" ? "Усі постачальники" : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі постачальники</SelectItem>
                {supplierOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>№ видаткової постачальника</FieldLabel>
            <Input
              value={supplierDocument}
              onChange={(e) => setSupplierDocument(e.target.value)}
              placeholder="Накладна №…"
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Статус</FieldLabel>
            <Select value={status} onValueChange={(v) => setStatus((v as ReceivingDocStatus | "all") ?? "all")}>
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(v: string) => STATUS_FILTER_OPTIONS.find((o) => o.value === v)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Номер документа</TableHead>
              <TableHead>Постачальник</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Виконання</TableHead>
              <TableHead>Документ постачальника</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} />
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {documents.length === 0 ? "Ще немає жодного документа надходження" : "Нічого не знайдено"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
