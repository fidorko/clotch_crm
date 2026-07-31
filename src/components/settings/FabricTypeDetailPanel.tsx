"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, MoreHorizontal, Pencil, Scissors, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailRow } from "@/components/ui/detail-row";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FabricTypeFormDialog } from "@/components/settings/FabricTypeFormDialog";
import { getCareInstructionIcon } from "@/lib/constants/care-instruction-icons";
import { seasonLabel, stretchLabel } from "@/lib/constants/fabric-options";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import { deleteFabricTypeAction } from "@/app/settings/references/fabric-materials/actions";

function InfoHint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-default text-muted-foreground" />}>
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export function FabricTypeDetailPanel({
  fabricType,
  materials,
  careInstructions,
  onDeleted,
}: {
  fabricType: FabricTypeDetail;
  materials: MaterialRow[];
  careInstructions: CareInstructionRow[];
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete() {
    startDeleting(async () => {
      await deleteFabricTypeAction(fabricType.id);
      router.refresh();
      setIsDeleteOpen(false);
      onDeleted();
    });
  }

  const schemaNotesLines = fabricType.schemaNotes?.split("\n").map((line) => line.trim()).filter(Boolean) ?? [];
  const selectedCareInstructions = careInstructions.filter((c) => fabricType.careInstructionIds.includes(c.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{fabricType.name}</h2>
            <Badge variant={fabricType.isActive ? "success" : "outline"}>
              {fabricType.isActive ? "Активний" : "Неактивний"}
            </Badge>
          </div>
          {fabricType.description && <p className="text-sm text-muted-foreground">{fabricType.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FabricTypeFormDialog
            trigger={
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Pencil className="size-3.5" />
                Редагувати
              </Button>
            }
            fabricType={fabricType}
            materials={materials}
            careInstructions={careInstructions}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="cursor-pointer" aria-label="Ще дії" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="size-3.5" />
                Видалити
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-0.5">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Основна інформація</h3>
            <DetailRow align="left" label="Назва" value={fabricType.name} />
            <DetailRow align="left" label="Код" value={<span className="font-mono text-xs">{fabricType.code}</span>} />
            {fabricType.description && <DetailRow align="left" label="Опис" value={fabricType.description} />}
            {fabricType.density && <DetailRow align="left" label="Щільність" value={fabricType.density} />}
            {fabricType.stretch && <DetailRow align="left" label="Розтяжність" value={stretchLabel(fabricType.stretch)} />}
            {fabricType.seasons.length > 0 && (
              <DetailRow align="left" label="Сезон" value={fabricType.seasons.map(seasonLabel).join(" / ")} />
            )}
            {fabricType.recommendedUse && (
              <DetailRow align="left" label="Рекомендоване призначення" value={fabricType.recommendedUse} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">Типовий склад</h3>
              <InfoHint text="Використовується як підказка при створенні товарів." />
            </div>
            {fabricType.composition.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {fabricType.composition.map((item) => (
                  <div key={item.materialId} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                    <span className="flex items-center gap-1.5">
                      {item.color && (
                        <span className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: item.color }} />
                      )}
                      {item.name}
                    </span>
                    <span className="font-medium text-foreground">{item.percent}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Склад не вказано</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-foreground">Можливі матеріали</h3>
              <InfoHint text="Які матеріали допустимі для цього типу тканини." />
            </div>
            {materials.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {materials.map((material) => (
                  <label key={material.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Checkbox checked={fabricType.possibleMaterialIds.includes(material.id)} disabled />
                    {material.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Матеріалів ще немає</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Рекомендації по догляду</h3>
            {selectedCareInstructions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {selectedCareInstructions.map((item) => {
                  const Icon = getCareInstructionIcon(item.icon);
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-4" />
                      </span>
                      {item.name}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Рекомендацій ще немає</p>
            )}
          </CardContent>
        </Card>

        {(fabricType.schemaImageUrl || schemaNotesLines.length > 0) && (
          <Card className="lg:col-span-2">
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-1.5 sm:hidden">
                <h3 className="text-sm font-semibold text-foreground">Схема тканини</h3>
              </div>
              {fabricType.schemaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fabricType.schemaImageUrl}
                  alt={`Схема тканини ${fabricType.name}`}
                  className="h-40 w-full shrink-0 rounded-lg object-cover sm:w-56"
                />
              ) : (
                <span className="flex h-40 w-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:w-56">
                  <Scissors className="size-6" />
                </span>
              )}
              <div className="flex flex-col gap-1.5">
                <h3 className="hidden text-sm font-semibold text-foreground sm:block">Схема тканини (приклад)</h3>
                {schemaNotesLines.length > 0 && (
                  <ul className="list-disc pl-4 text-sm text-muted-foreground">
                    {schemaNotesLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити тип тканини?</DialogTitle>
            <DialogDescription>
              «{fabricType.name}» буде видалено разом зі складом, можливими матеріалами й вибраними
              рекомендаціями по догляду для цього типу. Самі матеріали та інструкції в довіднику лишаться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" className="cursor-pointer" />}>
              Скасувати
            </DialogClose>
            <Button type="button" variant="destructive" className="cursor-pointer" onClick={handleDelete} disabled={isDeleting}>
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
