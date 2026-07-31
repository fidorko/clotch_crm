"use client";

import { type ReactElement, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FabricTypeCompositionEditor, type CompositionRow } from "@/components/settings/FabricTypeCompositionEditor";
import { FabricTypePossibleMaterialsField } from "@/components/settings/FabricTypePossibleMaterialsField";
import { FabricTypeCareInstructionsField } from "@/components/settings/FabricTypeCareInstructionsField";
import { FABRIC_SEASON_OPTIONS, FABRIC_STRETCH_OPTIONS } from "@/lib/constants/fabric-options";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { FabricSeason, FabricStretch, FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import {
  createFabricTypeAction,
  updateFabricTypeAction,
  uploadFabricTypeImageAction,
} from "@/app/settings/references/fabric-materials/actions";

export function FabricTypeFormDialog({
  trigger,
  fabricType,
  materials,
  careInstructions,
  onCreated,
}: {
  trigger: ReactElement;
  fabricType?: FabricTypeDetail;
  materials: MaterialRow[];
  careInstructions: CareInstructionRow[];
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [localMaterials, setLocalMaterials] = useState<MaterialRow[]>(materials);
  const [localCareInstructions, setLocalCareInstructions] = useState<CareInstructionRow[]>(careInstructions);

  const [name, setName] = useState(fabricType?.name ?? "");
  const [description, setDescription] = useState(fabricType?.description ?? "");
  const [density, setDensity] = useState(fabricType?.density ?? "");
  const [stretch, setStretch] = useState<FabricStretch | "">(fabricType?.stretch ?? "");
  const [recommendedUse, setRecommendedUse] = useState(fabricType?.recommendedUse ?? "");
  const [isActive, setIsActive] = useState(fabricType?.isActive ?? true);
  const [seasons, setSeasons] = useState<FabricSeason[]>(fabricType?.seasons ?? []);
  const [composition, setComposition] = useState<CompositionRow[]>(
    fabricType?.composition.map((c) => ({ materialId: c.materialId, percent: c.percent })) ?? []
  );
  const [possibleMaterialIds, setPossibleMaterialIds] = useState<string[]>(fabricType?.possibleMaterialIds ?? []);
  const [careInstructionIds, setCareInstructionIds] = useState<string[]>(fabricType?.careInstructionIds ?? []);
  const [schemaImageUrl, setSchemaImageUrl] = useState<string | null>(fabricType?.schemaImageUrl ?? null);
  const [schemaNotes, setSchemaNotes] = useState(fabricType?.schemaNotes ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  function toggleSeason(season: FabricSeason) {
    setSeasons((prev) => (prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    startSaving(async () => {
      try {
        const url = await uploadFabricTypeImageAction(fd);
        setSchemaImageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося завантажити зображення");
      } finally {
        setIsUploadingImage(false);
      }
    });
  }

  function handleSubmit() {
    setError(null);
    const input = {
      name,
      description: description || null,
      density: density || null,
      stretch: stretch || null,
      recommendedUse: recommendedUse || null,
      schemaImageUrl,
      schemaNotes: schemaNotes || null,
      isActive,
      seasons,
      composition,
      possibleMaterialIds,
      careInstructionIds,
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
              <label className="text-xs text-muted-foreground">Назва</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Футер 3-нитка" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Опис</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Щільність</label>
                <Input value={density} onChange={(e) => setDensity(e.target.value)} placeholder="напр. 320-340 г/м²" />
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Сезон</label>
              <div className="flex flex-wrap gap-3">
                {FABRIC_SEASON_OPTIONS.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <Checkbox checked={seasons.includes(o.value)} onCheckedChange={() => toggleSeason(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Рекомендоване призначення</label>
              <Input
                value={recommendedUse}
                onChange={(e) => setRecommendedUse(e.target.value)}
                placeholder="напр. Худі, світшоти, штани, костюми"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              Активний
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Типовий склад</h3>
            <FabricTypeCompositionEditor composition={composition} onChange={setComposition} materials={localMaterials} />
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

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Схема тканини</h3>
            <button
              type="button"
              onClick={() => document.getElementById("fabric-type-schema-image-input")?.click()}
              disabled={isUploadingImage}
              className="flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 transition-colors hover:border-primary disabled:cursor-default"
            >
              {schemaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={schemaImageUrl} alt="Схема тканини" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImageIcon className="size-6" />
                  <span className="flex items-center gap-1 text-xs">
                    <Upload className="size-3" />
                    {isUploadingImage ? "Завантаження..." : "Завантажити зображення"}
                  </span>
                </span>
              )}
            </button>
            <input
              id="fabric-type-schema-image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Примітки (кожен рядок — окремий пункт)</label>
              <Textarea
                value={schemaNotes}
                onChange={(e) => setSchemaNotes(e.target.value)}
                rows={4}
                placeholder={"Лицьова сторона: гладка\nВиворітний бік: начос\nЩільність: 320-340 г/м²"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Рекомендації по догляду</h3>
            <FabricTypeCareInstructionsField
              careInstructions={localCareInstructions}
              onCareInstructionsChange={setLocalCareInstructions}
              selectedIds={careInstructionIds}
              onSelectedIdsChange={setCareInstructionIds}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving || !name.trim()} className="cursor-pointer">
            {fabricType ? "Зберегти" : "Створити"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
