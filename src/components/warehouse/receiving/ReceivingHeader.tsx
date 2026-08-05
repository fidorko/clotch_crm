"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, ChevronDown, Warehouse } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { createReceivingDocumentAction } from "@/app/warehouse/receiving/actions";

// Одна кнопка «Додати надходження» — тип (планове/фактичне) обирається у
// випадному меню тут же, документ створюється одразу (isPlanned фіксується
// назавжди на цьому кроці), редірект на готову сторінку документа без
// проміжного гейту (пряма вказівка людини, warehouse-receiving.md).
export function ReceivingHeader({ warehouseId }: { warehouseId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCreate(isPlanned: boolean) {
    startTransition(async () => {
      const created = await createReceivingDocumentAction({ isPlanned, warehouseId });
      router.push(`/warehouse/receiving/${created.id}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/warehouse" className="hover:text-foreground">
            Склад
          </Link>
          <span>/</span>
          <span className="text-foreground">Надходження</span>
        </nav>
        <HeaderActions />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/warehouse"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            aria-label="Назад до складу"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Надходження</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button disabled={isPending} />}>
            Додати надходження
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCreate(true)}>
              <CalendarClock className="size-4" />
              Планове надходження
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreate(false)}>
              <Warehouse className="size-4" />
              Фактичне надходження
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
