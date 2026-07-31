import Link from "next/link";
import { ChevronRight, Coins, Factory, Globe, Plus, Scale, Truck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAddReferenceItemButton } from "@/components/settings/QuickAddReferenceItemButton";
import { CustomCharacteristicFormDialog } from "@/components/settings/CustomCharacteristicFormDialog";
import { CustomCharacteristicTile } from "@/components/settings/CustomCharacteristicTile";
import { ColorsTile } from "@/components/settings/ColorsTile";
import { FabricTypesTile } from "@/components/settings/FabricTypesTile";
import { CareInstructionsTile } from "@/components/settings/CareInstructionsTile";
import { SizesMeasurementsTile } from "@/components/settings/SizesMeasurementsTile";
import { ReferenceDictionaryFlagsRow } from "@/components/settings/ReferenceDictionaryFlagsRow";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";
import type { CustomCharacteristicWithValues } from "@/server/data/custom-characteristics";
import type { ColorRow } from "@/server/data/colors";
import type { FabricTypeDetail } from "@/server/data/fabric-types";
import type { MaterialRow } from "@/server/data/materials";
import type { CareInstructionRow } from "@/server/data/care-instructions";
import type { SizeTypeWithValues } from "@/server/data/size-types";
import type { MeasurementTypeWithValues } from "@/server/data/measurement-types";
import type { DictionaryFlags } from "@/server/data/reference-dictionary-flags";

const DEFAULT_DICTIONARY_FLAGS: DictionaryFlags = {
  showInCrm: true,
  showOnStorefront: true,
  participatesInFilters: true,
};

type ReferenceGroup = "characteristics" | "system";

interface ReferenceValue {
  label: string;
  swatch?: string;
  href?: string;
}

interface ReferenceItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconClass: string;
  group: ReferenceGroup;
  count?: number;
  values?: ReferenceValue[];
  hasData?: boolean;
}

const MAX_VISIBLE_VALUES = 7;

const GROUP_TITLES: Record<ReferenceGroup, string> = {
  characteristics: "Характеристики товару",
  system: "Системні",
};

// id, що збігається з ReferenceItemKind, автоматично отримує реальну сторінку
// /settings/references/{id} + "+Додати" на плитці (нижче, ReferenceTile).
// group — за прямою вказівкою: "Характеристики товару" (описують сам товар) і
// "Системні" (довідники бізнес-процесу, не характеристики виробу).
const REFERENCE_DEFS: Omit<ReferenceItem, "count" | "values" | "hasData">[] = [
  {
    id: "manufacturers",
    label: "Виробники",
    description: "Виробники та бренди товарів",
    icon: Factory,
    href: "/settings/references/manufacturers",
    iconClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    group: "system",
  },
  {
    id: "suppliers",
    label: "Постачальники",
    description: "Постачальники та партнери",
    icon: Truck,
    href: "/settings/references/suppliers",
    iconClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    group: "system",
  },
  {
    id: "countries",
    label: "Країни",
    description: "Країни виробництва та походження",
    icon: Globe,
    href: "/settings/references/countries",
    iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    group: "system",
  },
  {
    id: "currencies",
    label: "Валюти",
    description: "Валюти та курси обміну",
    icon: Coins,
    href: "/settings/references/currencies",
    iconClass: "bg-green-500/15 text-green-600 dark:text-green-400",
    group: "system",
  },
  {
    id: "units",
    label: "Одиниці виміру",
    description: "Одиниці виміру та ваги",
    icon: Scale,
    href: "/settings/references/units",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    group: "system",
  },
];

function ValueChip({ value }: { value: ReferenceValue }) {
  const content = (
    <>
      {value.swatch && (
        <span
          className="size-2 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value.swatch }}
        />
      )}
      {value.label}
    </>
  );
  const className =
    "inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground";

  if (value.href) {
    return (
      <Link
        href={value.href}
        className={cn(className, "cursor-pointer transition-colors hover:border-primary hover:text-primary")}
      >
        {content}
      </Link>
    );
  }
  return <span className={className}>{content}</span>;
}

const ADD_LINK_CLASS =
  "inline-flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary";

function AddSlot({ item }: { item: ReferenceItem }) {
  if (item.id === "suppliers") {
    return (
      <Link href="/settings/references/suppliers/new" className={ADD_LINK_CLASS}>
        <Plus className="size-3" />
        Додати
      </Link>
    );
  }
  if (item.id === "currencies") {
    return (
      <Link href={item.href} className={ADD_LINK_CLASS}>
        <Plus className="size-3" />
        Додати
      </Link>
    );
  }
  return <QuickAddReferenceItemButton source={{ type: "reference-item", kind: item.id as ReferenceItemKind }} />;
}

function ReferenceTile({ item, flags }: { item: ReferenceItem; flags?: DictionaryFlags }) {
  const visibleValues = item.values?.slice(0, MAX_VISIBLE_VALUES) ?? [];
  const hasMore = (item.values?.length ?? 0) > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <Link href={item.href} className="flex cursor-pointer items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", item.iconClass)}>
          <item.icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
          <span className="truncate text-xs text-muted-foreground">{item.description}</span>
        </div>
        {item.count !== undefined && (
          <span className="shrink-0 text-sm font-medium text-muted-foreground">{item.count}</span>
        )}
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleValues.map((value) => (
          <ValueChip key={value.label} value={value} />
        ))}
        {hasMore && (
          <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
            …
          </span>
        )}
        <AddSlot item={item} />
      </div>
      {flags && <ReferenceDictionaryFlagsRow dictionaryKey={item.id} flags={flags} />}
    </div>
  );
}

export function ReferencesList({
  colors = [],
  currencies = [],
  suppliers = [],
  referenceItemsByKind = {},
  customCharacteristics = [],
  dictionaryFlags = {},
  fabricTypes = [],
  materials = [],
  careInstructions = [],
  sizeTypes = [],
  measurementTypes = [],
}: {
  colors?: ColorRow[];
  currencies?: { code: string; symbol: string }[];
  suppliers?: { id: string; name: string }[];
  referenceItemsByKind?: Record<string, { id: string; name: string }[]>;
  customCharacteristics?: CustomCharacteristicWithValues[];
  dictionaryFlags?: Record<string, DictionaryFlags>;
  fabricTypes?: FabricTypeDetail[];
  materials?: MaterialRow[];
  careInstructions?: CareInstructionRow[];
  sizeTypes?: SizeTypeWithValues[];
  measurementTypes?: MeasurementTypeWithValues[];
}) {
  const items: ReferenceItem[] = REFERENCE_DEFS.map((def) => {
    if (def.id === "currencies") {
      return {
        ...def,
        count: currencies.length,
        values: currencies.map((c) => ({
          label: c.symbol ? `${c.code} ${c.symbol}` : c.code,
          href: "/settings/references/currencies",
        })),
        hasData: true,
      };
    }
    if (def.id === "suppliers") {
      return {
        ...def,
        count: suppliers.length,
        values: suppliers.map((s) => ({
          label: s.name,
          href: `/settings/references/suppliers/${s.id}`,
        })),
        hasData: true,
      };
    }
    const values = referenceItemsByKind[def.id] ?? [];
    return {
      ...def,
      count: values.length,
      values: values.map((v) => ({ label: v.name, href: def.href })),
      hasData: true,
    };
  });

  const systemItems = items.filter((item) => item.group === "system");

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">{GROUP_TITLES.characteristics}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ColorsTile colors={colors} flags={dictionaryFlags.colors ?? DEFAULT_DICTIONARY_FLAGS} />
          <FabricTypesTile
            fabricTypes={fabricTypes}
            materials={materials}
            flags={dictionaryFlags["fabric-materials"] ?? DEFAULT_DICTIONARY_FLAGS}
          />
          <CareInstructionsTile
            careInstructions={careInstructions}
            flags={dictionaryFlags["care-instructions"] ?? DEFAULT_DICTIONARY_FLAGS}
          />
          <SizesMeasurementsTile
            sizeTypes={sizeTypes}
            measurementTypes={measurementTypes}
            flags={dictionaryFlags["measurements"] ?? DEFAULT_DICTIONARY_FLAGS}
          />
          {customCharacteristics.map((characteristic) => (
            <CustomCharacteristicTile key={characteristic.id} characteristic={characteristic} />
          ))}
          <CustomCharacteristicFormDialog
            trigger={
              <button
                type="button"
                className="flex min-h-[136px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-5" />
                <span className="text-sm font-medium">Додати довідник</span>
              </button>
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">{GROUP_TITLES.system}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {systemItems.map((item) => (
            <ReferenceTile key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
