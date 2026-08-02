"use client";

import { type ReactElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FabricTypePossibleMaterialsField } from "@/components/settings/FabricTypePossibleMaterialsField";
import { FABRIC_STRETCH_OPTIONS } from "@/lib/constants/fabric-options";
import type { FabricStretch, FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import {
  createFabricTypeAction,
  deleteFabricTypeAction,
  updateFabricTypeAction,
} from "@/app/settings/references/fabric-materials-actions";

export function FabricTypeFormDialog({
  trigger,
  fabricType,
  materials,
  onCreated,
}: {
  trigger: ReactElement;
  fabricType?: FabricTypeDetail;
  materials: MaterialRow[];
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [localMaterials, setLocalMaterials] = useState<MaterialRow[]>(materials);

  const [name, setName] = useState(fabricType?.name ?? "");
  const [description, setDescription] = useState(fabricType?.description ?? "");
  const [density, setDensity] = useState(fabricType?.density ?? "");
  const [stretch, setStretch] = useState<FabricStretch | "">(fabricType?.stretch ?? "");
  const [frontSide, setFrontSide] = useState(fabricType?.frontSide ?? "");
  const [backSide, setBackSide] = useState(fabricType?.backSide ?? "");
  const [tactileFeel, setTactileFeel] = useState(fabricType?.tactileFeel ?? "");
  const [isActive, setIsActive] = useState(fabricType?.isActive ?? true);
  // За замовчуванням для нового типу тканини — усі наявні матеріали позначені
  // можливими (людина сама звужує список), для редагування — наявний вибір.
  const [possibleMaterialIds, setPossibleMaterialIds] = useState<string[]>(
    fabricType?.possibleMaterialIds ?? materials.map((m) => m.id)
  );

  function handleSubmit() {
    setError(null);
    const input = {
      name,
      description: description || null,
      density: density || null,
      stretch: stretch || null,
      frontSide: frontSide || null,
      backSide: backSide || null,
      tactileFeel: tactileFeel || null,
      isActive,
      possibleMaterialIds,
    };
    startSaving(async () => {
      try {
        if (fabricType) {
          await updateFabricTypeAction(fabricType.id, input);
          router.refresh();
          setOpen(false);
        } else {
          const created = await createFabricTypeAction(input);
          router.refresh();
          setOpen(false);
          onCreated?.(created.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти тип тканини");
      }
    });
  }

  function handleDelete() {
    if (!fabricType) return;
    startDeleting(async () => {
      await deleteFabricTypeAction(fabricType.id);
      router.refresh();
      setIsDeleteOpen(false);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fabricType ? "Редагувати тип тканини" : "Додати тип тканини"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Основна інформація</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Назва тканини</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Футер 3-нитка" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Короткий опис тканини</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Щільність, г/м²</label>
                <Input value={density} onChange={(e) => setDensity(e.target.value)} placeholder="напр. 320-340" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Розтяжність</label>
                <Select value={stretch} onValueChange={(v) => setStretch((v as FabricStretch) ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => FABRIC_STRETCH_OPTIONS.find((o) => o.value === v)?.label ?? "Не вказано"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FABRIC_STRETCH_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Лицьова сторона</label>
                <Input value={frontSide} onChange={(e) => setFrontSide(e.target.value)} placeholder="напр. гладка" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Тильна сторона</label>
                <Input value={backSide} onChange={(e) => setBackSide(e.target.value)} placeholder="напр. начос" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Тактильні відчуття</label>
              <Input
                value={tactileFeel}
                onChange={(e) => setTactileFeel(e.target.value)}
                placeholder="напр. м'яка, тепла"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              Активний
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Можливі матеріали</h3>
            <FabricTypePossibleMaterialsField
              materials={localMaterials}
              onMaterialsChange={setLocalMaterials}
              selectedIds={possibleMaterialIds}
              onSelectedIdsChange={setPossibleMaterialIds}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className={fabricType ? "sm:justify-between" : undefined}>
          {fabricType && (
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Видалити
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving || !name.trim()} className="cursor-pointer">
              {fabricType ? "Зберегти" : "Створити"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {fabricType && (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Видалити тип тканини?</DialogTitle>
              <DialogDescription>
                «{fabricType.name}» буде видалено разом зі списком можливих матеріалів для цього типу. Самі
                матеріали в довіднику лишаться.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>
                Скасувати
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                className="cursor-pointer"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Видалити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
