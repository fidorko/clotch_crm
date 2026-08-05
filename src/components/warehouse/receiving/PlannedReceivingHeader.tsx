import Link from "next/link";
import { ArrowLeft, Check, PackageCheck, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { HeaderActions } from "@/components/layout/HeaderActions";
import { RECEIVING_DOC_STATUS_META, receivingDocTypeLabel, type ReceivingDocStatus } from "@/lib/types/receiving";

export function PlannedReceivingHeader({
  documentNumber,
  isPlanned,
  status,
  locked,
  completedAtLabel,
  onSave,
  saving,
  justSaved,
  onAccept,
  accepting,
  onComplete,
  completeBlockedReason,
  completing,
}: {
  documentNumber: string;
  isPlanned: boolean;
  status: ReceivingDocStatus;
  locked: boolean;
  completedAtLabel: string | null;
  // Кнопка «Зберегти» — лише для планового (пряма вказівка людини); дані й
  // так автозберігаються по ходу, кнопка форсує негайний запис поточних
  // значень і дає видиме підтвердження.
  onSave?: () => void;
  saving?: boolean;
  justSaved?: boolean;
  // Присутній лише для планового документа в стані «Очікується поставка».
  onAccept?: () => void;
  accepting?: boolean;
  // Присутній, поки документ у стані «В процесі» (ще не завершений).
  onComplete?: () => void;
  // Не null — «Завершити» видима, але disabled з підказкою-причиною
  // (нема постачальника/відповідальної особи, пряма вказівка людини).
  completeBlockedReason?: string | null;
  completing?: boolean;
}) {
  const title = `${receivingDocTypeLabel(isPlanned)} надходження`;
  const statusMeta = RECEIVING_DOC_STATUS_META[status];

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/warehouse" className="hover:text-foreground">
            Склад
          </Link>
          <span>/</span>
          <Link href="/warehouse/receiving" className="hover:text-foreground">
            Надходження
          </Link>
          <span>/</span>
          <span className="text-foreground">{documentNumber}</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/warehouse/receiving"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            aria-label="Назад до списку надходжень"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button type="button" variant="outline" onClick={onSave} disabled={saving}>
              {justSaved ? <Check className="size-4" /> : <Save className="size-4" />}
              {justSaved ? "Збережено" : "Зберегти"}
            </Button>
          )}
          {onAccept && (
            <button type="button" onClick={onAccept} disabled={accepting} className={buttonVariants({})}>
              {accepting ? <Check className="size-4" /> : <PackageCheck className="size-4" />}
              Прийняти на склад
            </button>
          )}
          {onComplete &&
            (completeBlockedReason ? (
              <Button disabled title={completeBlockedReason}>
                <Check className="size-4" />
                Завершити
              </Button>
            ) : (
              <Dialog>
                <DialogTrigger render={<Button disabled={completing} />}>
                  <Check className="size-4" />
                  Завершити
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Завершити документ?</DialogTitle>
                    <DialogDescription>
                      Прийнята кількість буде оприходована на склад, редагування документа й позицій стане
                      недоступним. Стане доступним формування акту приймання-передачі.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
                    <DialogClose render={<Button type="button" onClick={onComplete} />}>Завершити</DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
        </div>
      </div>

      {locked && completedAtLabel && (
        <p className="text-sm text-muted-foreground">
          Документ завершено {completedAtLabel} — редагування недоступне.
        </p>
      )}
    </div>
  );
}
