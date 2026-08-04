"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, CornerDownRight, Download, PackageCheck, Printer, Trash2 } from "lucide-react";
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
  RECEIVING_DOC_DISPLAY_STATUS_META,
  RECEIVING_DOC_TYPE_BADGE,
  RECEIVING_DOC_TYPE_LABEL,
  computeReceivingDocDisplayStatus,
  type ReceivingDocDisplayStatus,
  type ReceivingDocumentListItem,
} from "@/lib/types/receiving";
import { createActualReceivingFromPlannedAction, deleteReceivingDocumentAction } from "@/app/warehouse/receiving/actions";

const STATUS_FILTER_OPTIONS: { value: ReceivingDocDisplayStatus | "all"; label: string }[] = [
  { value: "all", label: "Усі статуси" },
  ...(Object.entries(RECEIVING_DOC_DISPLAY_STATUS_META) as [ReceivingDocDisplayStatus, { label: string }][]).map(
    ([value, meta]) => ({ value, label: meta.label })
  ),
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}

type Row =
  | { kind: "single"; doc: ReceivingDocumentListItem }
  | { kind: "pair"; planned: ReceivingDocumentListItem; actual: ReceivingDocumentListItem };

// Список сортований за createdAt DESC — фактичне завжди створюється ПІЗНІШЕ
// планового (через «Прийняти на склад»), тож завжди йде ПЕРЕД ним у списку.
// Тому пару шукаємо саме від фактичного до його планового (пряме посилання
// за id), а не навпаки: попередня версія шукала "хто вказує на мене" від
// планового — на момент, коли цикл доходив до планового, фактичне вже було
// відвідане й помилково позначене consumed як одиночний рядок, і пара
// губилась (ловила людина на реальних даних).
function groupDocuments(docs: ReceivingDocumentListItem[]): Row[] {
  const consumed = new Set<string>();
  const rows: Row[] = [];
  for (const doc of docs) {
    if (consumed.has(doc.id)) continue;
    if (doc.type === "actual" && doc.basedOnId) {
      const planned = docs.find((d) => d.id === doc.basedOnId && !consumed.has(d.id));
      if (planned) {
        rows.push({ kind: "pair", planned, actual: doc });
        consumed.add(doc.id);
        consumed.add(planned.id);
        continue;
      }
    }
    rows.push({ kind: "single", doc });
    consumed.add(doc.id);
  }
  return rows;
}

// Копіювати/Друк/Експорт — заглушки (нема бекенду під них). Видалення —
// реальне, і лише для планового: фактичне видалити не можна (пряма вказівка
// людини) — тому кнопка навіть не рендериться для type=actual, не просто
// вимкнена. «Прийняти на склад» — так само лише для планового: створює
// реальний фактичний документ на його основі (warehouse-receiving.md).
function RowActions({ doc }: { doc: ReceivingDocumentListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteReceivingDocumentAction(doc.id);
      router.refresh();
    });
  }

  function handleAccept() {
    startTransition(async () => {
      const actual = await createActualReceivingFromPlannedAction(doc.id);
      router.push(`/warehouse/receiving/${actual.id}`);
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
      {doc.type === "planned" && (
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
      {doc.type === "planned" && (
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
              <DialogDescription>Планове надходження «{doc.number}» буде видалено остаточно.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
              <DialogClose render={<Button type="button" variant="destructive" onClick={handleDelete} />}>
                Видалити
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  linkedNote,
  groupTint,
  noBottomBorder,
}: {
  doc: ReceivingDocumentListItem;
  linkedNote?: string;
  groupTint?: boolean;
  noBottomBorder?: boolean;
}) {
  const displayStatus = RECEIVING_DOC_DISPLAY_STATUS_META[computeReceivingDocDisplayStatus(doc)];

  return (
    <TableRow className={cn(groupTint && "bg-accent/[0.04] hover:bg-accent/[0.07]", noBottomBorder && "border-b-0")}>
      <TableCell
        className={cn("font-medium text-foreground", groupTint && "border-l-2 border-l-accent-foreground/50")}
      >
        <div className="flex items-center gap-1.5">
          {linkedNote && <CornerDownRight className="size-3.5 shrink-0 text-accent-foreground" />}
          <Link href={`/warehouse/receiving/${doc.id}`} className="hover:underline">
            {doc.number}
          </Link>
        </div>
        {linkedNote && <span className="pl-5 text-xs font-normal text-muted-foreground">{linkedNote}</span>}
      </TableCell>
      <TableCell>
        <Badge variant={RECEIVING_DOC_TYPE_BADGE[doc.type]}>{RECEIVING_DOC_TYPE_LABEL[doc.type]}</Badge>
      </TableCell>
      <TableCell>{doc.supplier ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{doc.date ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("border-transparent", displayStatus.className)}>
          {displayStatus.label}
        </Badge>
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
  const [number, setNumber] = useState("");
  const [supplierDocument, setSupplierDocument] = useState("");
  const [status, setStatus] = useState<ReceivingDocDisplayStatus | "all">("all");

  const supplierOptions = Array.from(
    new Set(documents.map((d) => d.supplier).filter((s): s is string => Boolean(s)))
  );

  const filtered = documents.filter((doc) => {
    if (supplier !== "all" && doc.supplier !== supplier) return false;
    if (status !== "all" && computeReceivingDocDisplayStatus(doc) !== status) return false;
    if (number && !doc.number.toLowerCase().includes(number.toLowerCase())) return false;
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

  const rows = groupDocuments(filtered);

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col divide-y divide-border px-0">
        <div className="flex flex-wrap items-end gap-3 p-4">
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
            <FieldLabel>Номер</FieldLabel>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="RCV-2026-…"
              className="w-36"
            />
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
            <Select value={status} onValueChange={(v) => setStatus((v as ReceivingDocDisplayStatus | "all") ?? "all")}>
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
              <TableHead>Тип</TableHead>
              <TableHead>Постачальник</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Документ постачальника</TableHead>
              <TableHead>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) =>
              row.kind === "single" ? (
                <DocumentRow key={row.doc.id} doc={row.doc} />
              ) : (
                <>
                  <DocumentRow key={row.planned.id} doc={row.planned} groupTint noBottomBorder />
                  <DocumentRow
                    key={row.actual.id}
                    doc={row.actual}
                    groupTint
                    linkedNote={`на основі ${row.planned.number}`}
                  />
                </>
              )
            )}
            {rows.length === 0 && (
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
