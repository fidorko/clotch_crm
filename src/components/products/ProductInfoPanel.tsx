"use client";

import { useState } from "react";
import {
  Ban,
  BrushCleaning,
  CircleSlash2,
  Droplet,
  DropletOff,
  Thermometer,
  WashingMachine,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectRow } from "@/components/ui/select-row";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Product } from "@/lib/types/product";

// Тимчасовий довідник інструкцій по догляду. Планово — довідник з БД (див. db.md).
interface CareOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CARE_OPTIONS: CareOption[] = [
  { id: "machine-wash", label: "Машинне прання", icon: WashingMachine },
  { id: "hand-wash", label: "Ручне прання", icon: Droplet },
  { id: "no-wash", label: "Не прати", icon: DropletOff },
  { id: "no-bleach", label: "Не відбілювати", icon: Ban },
  { id: "iron-low", label: "Прасування при низькій т°", icon: Thermometer },
  { id: "no-iron", label: "Не прасувати", icon: CircleSlash2 },
  { id: "dry-clean", label: "Хімчистка", icon: BrushCleaning },
  { id: "tumble-dry", label: "Сушіння в барабані", icon: Wind },
] as const;

const DEFAULT_CARE_IDS = ["machine-wash", "no-bleach", "iron-low", "tumble-dry", "dry-clean"];

function CareInstructionsRow({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const selectedOptions = CARE_OPTIONS.filter((option) => selectedIds.includes(option.id));

  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">Інструкція по догляду</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1 hover:border-input hover:bg-accent/50 data-popup-open:border-input">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            selectedOptions.map((option) => (
              <Tooltip key={option.id}>
                <TooltipTrigger render={<span className="flex items-center text-foreground" />}>
                  <option.icon className="size-4.5" />
                </TooltipTrigger>
                <TooltipContent>{option.label}</TooltipContent>
              </Tooltip>
            ))
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Інструкції по догляду</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {CARE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.id}
                checked={selectedIds.includes(option.id)}
                onCheckedChange={() => onToggle(option.id)}
              >
                <option.icon className="size-4 text-muted-foreground" />
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Тимчасовий довідник категорій (шлях: тип одягу/категорія/підкатегорія). Планово — довідник з БД.
const CATEGORY_OPTIONS = [
  "Чоловічий одяг/Футболки/Футболки oversize",
  "Чоловічий одяг/Футболки/Футболки слімс",
  "Чоловічий одяг/Худі/Худі з капюшоном",
  "Жіночий одяг/Футболки/Футболки oversize",
  "Жіночий одяг/Сукні/Літні сукні",
  "Унісекс/Футболки/Базові футболки",
] as const;

function CategorySelectRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <span className="text-sm text-muted-foreground">Категорія</span>
      <Select value={value} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger className="w-full justify-between border-transparent bg-transparent px-1.5 text-sm font-normal text-foreground shadow-none hover:border-input hover:bg-accent/50 data-[state=open]:border-input">
          <SelectValue className="truncate" />
        </SelectTrigger>
        <SelectContent align="start">
          {CATEGORY_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Тимчасові варіанти для випадаючих списків. Планово — довідники з БД (див. db.md).
const INFO_OPTIONS = {
  gender: ["Унісекс", "Чоловіча", "Жіноча", "Дитяча"],
  seasonType: ["Літо", "Зима", "Демісезон", "Всесезонний"],
  fit: ["Oversize", "Regular", "Slim", "Relaxed"],
  countryOfOrigin: ["Туреччина", "Україна", "Китай", "Бангладеш", "Узбекистан"],
  manufacturer: ["TrendStyle", "BasicWear", "UkrTextile"],
  material: [
    "95% Cotton, 5% Elastane",
    "100% Cotton",
    "80% Cotton, 20% Polyester",
    "60% Cotton, 40% Polyester",
  ],
  density: ["180 gsm", "220 gsm", "240 gsm", "260 gsm", "300 gsm"],
  fabricType: ["Футер двонитка", "Футер тринитка", "Кулірна гладь", "Рибана"],
} as const satisfies Record<string, readonly string[]>;

type InfoField = keyof typeof INFO_OPTIONS;

const INFO_LABELS: Record<InfoField, string> = {
  gender: "Стать",
  seasonType: "Сезон",
  fit: "Посадка",
  countryOfOrigin: "Країна виробник",
  manufacturer: "Виробник",
  material: "Матеріал",
  density: "Щільність",
  fabricType: "Тип тканини",
};

export function ProductInfoPanel({ product }: { product: Product }) {
  const [info, setInfo] = useState(product.info);
  const [careIds, setCareIds] = useState(DEFAULT_CARE_IDS);

  function updateField(field: InfoField, value: string) {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }

  function updateCategory(value: string) {
    setInfo((prev) => ({ ...prev, category: value }));
  }

  function updateDescription(value: string) {
    setInfo((prev) => ({ ...prev, description: value }));
  }

  function toggleCareId(id: string) {
    setCareIds((prev) =>
      prev.includes(id) ? prev.filter((careId) => careId !== id) : [...prev, id]
    );
  }

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col divide-y divide-border px-4">
        <CategorySelectRow value={info.category} onChange={updateCategory} />
        {(Object.keys(INFO_OPTIONS) as InfoField[]).map((field) => (
          <SelectRow
            key={field}
            label={INFO_LABELS[field]}
            value={info[field]}
            options={INFO_OPTIONS[field]}
            onChange={(value) => updateField(field, value)}
          />
        ))}
        <CareInstructionsRow selectedIds={careIds} onToggle={toggleCareId} />
        <div className="py-2">
          <label htmlFor="product-description" className="mb-1 block text-sm text-muted-foreground">
            Опис
          </label>
          <Textarea
            id="product-description"
            value={info.description}
            onChange={(e) => updateDescription(e.target.value)}
            className="text-sm text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
}
