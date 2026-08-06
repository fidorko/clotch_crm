"use client";

import { useState, useTransition, type ReactElement } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDeleteIconButton } from "@/components/ui/confirm-delete-button";
import type { CompanyLegalEntityRow } from "@/server/data/company-legal-entities";
import {
  createCompanyLegalEntityAction,
  deleteCompanyLegalEntityAction,
  updateCompanyLegalEntityAction,
  type CompanyLegalEntityFormInput,
} from "@/app/settings/general/actions";

function defaultsFrom(entity: CompanyLegalEntityRow | undefined): CompanyLegalEntityFormInput {
  if (!entity) return { type: "fop", name: "", edrpou: "", isActive: true };
  return { type: entity.type, name: entity.name, edrpou: entity.edrpou, isActive: entity.isActive };
}

export function CompanyLegalEntityFormDialog({
  trigger,
  entity,
  onSaved,
}: {
  trigger: ReactElement;
  entity?: CompanyLegalEntityRow;
  onSaved: () => void;
}) {
  const isEdit = Boolean(entity);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyLegalEntityFormInput>(() => defaultsFrom(entity));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function setField<K extends keyof CompanyLegalEntityFormInput>(field: K, value: CompanyLegalEntityFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setForm(defaultsFrom(entity));
      setError(null);
    }
  }

  function handleSave() {
    setError(null);
    startSaving(async () => {
      try {
        if (isEdit && entity) {
          await updateCompanyLegalEntityAction(entity.id, form);
        } else {
          await createCompanyLegalEntityAction(form);
        }
        setOpen(false);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти компанію");
      }
    });
  }

  function handleDelete() {
    if (!entity) return;
    startSaving(async () => {
      try {
        await deleteCompanyLegalEntityAction(entity.id);
        setOpen(false);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося видалити компанію");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редагувати компанію" : "Додати компанію"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Зміни зберігаються одразу." : "Нова компанія з'явиться в списку нижче."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Тип</span>
            <RadioGroup
              value={form.type}
              onValueChange={(v) => v && setField("type", v as CompanyLegalEntityFormInput["type"])}
              className="flex flex-row items-center gap-4"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="fop" />
                ФОП
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="tov" />
                ТОВ
              </label>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="legal-entity-name">
              Назва *
            </label>
            <Input
              id="legal-entity-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder={form.type === "fop" ? "ФОП Іваненко Іван Іванович" : 'ТОВ «Мій магазин»'}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="legal-entity-edrpou">
              ЄДРПОУ *
            </label>
            <Input
              id="legal-entity-edrpou"
              value={form.edrpou}
              onChange={(e) => setField("edrpou", e.target.value.replace(/\D/g, ""))}
              placeholder="1234567890"
              className="sm:w-1/2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Статус</span>
            <RadioGroup
              value={form.isActive ? "active" : "inactive"}
              onValueChange={(v) => setField("isActive", v === "active")}
              className="flex flex-row items-center gap-4"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="active" />
                Активний
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="inactive" />
                Не активний
              </label>
            </RadioGroup>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          {isEdit ? (
            <ConfirmDeleteIconButton
              ariaLabel="Видалити компанію"
              title="Видалити компанію?"
              description={`«${entity?.name}» буде видалено безповоротно.`}
              onConfirm={handleDelete}
              className="rounded p-1.5 text-muted-foreground hover:text-destructive"
            />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Скасувати</DialogClose>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              Зберегти
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
