"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-options";
import type { SupplierRow } from "@/server/data/suppliers";
import { deleteSupplierAction } from "@/app/settings/references/suppliers/actions";

function typeLabel(type: string): string {
  return SUPPLIER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function DeleteSupplierButton({
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
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Видалити ${name}`} />}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Видалити постачальника?</DialogTitle>
          <DialogDescription>
            Постачальника «{name}» та всі його контакти й канали зв&apos;язку буде видалено безповоротно.
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

export function SuppliersList({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setError(null);
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await deleteSupplierAction(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити постачальника");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="gap-0 py-2">
        <CardContent className="flex flex-col divide-y divide-border px-0">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/settings/references/suppliers/${supplier.id}`}
                  className="truncate text-sm font-medium text-foreground hover:underline"
                >
                  {supplier.name}
                </Link>
                <span className="truncate text-xs text-muted-foreground">{supplier.code}</span>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {typeLabel(supplier.type)}
              </Badge>
              {supplier.website && (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:flex"
                >
                  <Globe className="size-3.5" />
                  {supplier.website}
                </a>
              )}
              <Badge variant={supplier.isActive ? "success" : "warning"} className="shrink-0">
                {supplier.isActive ? "Активний" : "Не активний"}
              </Badge>
              <DeleteSupplierButton
                name={supplier.name}
                disabled={pendingDeleteId === supplier.id}
                onConfirm={() => handleDelete(supplier.id)}
              />
            </div>
          ))}
          {suppliers.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Постачальників ще немає — натисніть «Додати постачальника»
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
