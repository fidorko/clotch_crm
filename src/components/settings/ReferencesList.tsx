import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Coins,
  Factory,
  Globe,
  Layers,
  Palette,
  Plus,
  Ruler,
  Scale,
  Scissors,
  Shirt,
  Tag,
  Tags,
  Truck,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QuickAddColorButton } from "@/components/settings/QuickAddColorButton";
import { QuickAddReferenceItemButton } from "@/components/settings/QuickAddReferenceItemButton";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";

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
  count?: number;
  values?: ReferenceValue[];
  hasData?: boolean;
}

const MAX_VISIBLE_VALUES = 7;

// id, що збігається з ReferenceItemKind, автоматично отримує реальну сторінку
// /settings/references/{id} + "+Додати" на плитці (нижче, ReferenceTile).
const REFERENCE_DEFS: Omit<ReferenceItem, "count" | "values" | "hasData">[] = [
  {
    id: "collections",
    label: "Колекції",
    description: "Керування колекціями товарів",
    icon: Layers,
    href: "/settings/references/collections",
    iconClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "seasons",
    label: "Сезон",
    description: "Сезони та періоди продажу",
    icon: CalendarDays,
    href: "/settings/references/seasons",
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "fabric-materials",
    label: "Тип тканини та матеріал",
    description: "Типи тканин та матеріали виробів",
    icon: Scissors,
    href: "/settings/references/fabric-materials",
    iconClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  {
    id: "manufacturers",
    label: "Виробники",
    description: "Виробники та бренди товарів",
    icon: Factory,
    href: "/settings/references/manufacturers",
    iconClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    id: "suppliers",
    label: "Постачальники",
    description: "Постачальники та партнери",
    icon: Truck,
    href: "/settings/references/suppliers",
    iconClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  {
    id: "care-instructions",
    label: "Інструкція по догляду",
    description: "Інструкції по догляду за виробами",
    icon: WashingMachine,
    href: "#",
    iconClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    id: "measurements",
    label: "Розміри та заміри",
    description: "Розмірні сітки та заміри",
    icon: Ruler,
    href: "#",
    iconClass: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  },
  {
    id: "brands",
    label: "Бренди",
    description: "Бренди та торгові марки",
    icon: Tag,
    href: "/settings/references/brands",
    iconClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    id: "countries",
    label: "Країни",
    description: "Країни виробництва та походження",
    icon: Globe,
    href: "/settings/references/countries",
    iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    id: "currencies",
    label: "Валюти",
    description: "Валюти та курси обміну",
    icon: Coins,
    href: "/settings/references/currencies",
    iconClass: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  {
    id: "colors",
    label: "Кольори",
    description: "Кольори та відтінки",
    icon: Palette,
    href: "/settings/references/colors",
    iconClass: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    id: "units",
    label: "Одиниці виміру",
    description: "Одиниці виміру та ваги",
    icon: Scale,
    href: "/settings/references/units",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    id: "tags",
    label: "Теги",
    description: "Теги та мітки товарів",
    icon: Tags,
    href: "/settings/references/tags",
    iconClass: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "fit",
    label: "Посадка",
    description: "Типи посадки одягу",
    icon: Shirt,
    href: "/settings/references/fit",
    iconClass: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  },
];

// Довідники, що досі не мають бекенду (інша форма даних, ніж "просто назва" —
// іконка на запис у "Інструкція по догляду", ціла розмірна сітка в "Розміри").
const NO_DATA_IDS = new Set(["care-instructions", "measurements"]);

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
      <Link href={value.href} className={cn(className, "transition-colors hover:border-primary hover:text-primary")}>
        {content}
      </Link>
    );
  }
  return <span className={className}>{content}</span>;
}

// "+ Додати" на плитці — для довідників без власної БД поки лише
// заглушка з поясненням (чесно, а не тиха бездія при кліку).
function DisabledAddHint() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground opacity-60" />
        }
      >
        <Plus className="size-3" />
        Додати
      </TooltipTrigger>
      <TooltipContent>Цей довідник ще не підключено до БД</TooltipContent>
    </Tooltip>
  );
}

function AddSlot({ item }: { item: ReferenceItem }) {
  if (item.id === "colors") return <QuickAddColorButton />;
  if (item.id === "suppliers") {
    return (
      <Link
        href="/settings/references/suppliers/new"
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="size-3" />
        Додати
      </Link>
    );
  }
  if (item.id === "tags") return <QuickAddReferenceItemButton source={{ type: "tag" }} />;
  if (!NO_DATA_IDS.has(item.id)) {
    return <QuickAddReferenceItemButton source={{ type: "reference-item", kind: item.id as ReferenceItemKind }} />;
  }
  return <DisabledAddHint />;
}

function ReferenceTile({ item }: { item: ReferenceItem }) {
  const visibleValues = item.values?.slice(0, MAX_VISIBLE_VALUES) ?? [];
  const hasMore = (item.values?.length ?? 0) > MAX_VISIBLE_VALUES;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
      <Link href={item.href} className="flex items-start gap-3">
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
    </div>
  );
}

export function ReferencesList({
  colors = [],
  suppliers = [],
  referenceItemsByKind = {},
  tags = [],
}: {
  colors?: { name: string; hex: string }[];
  suppliers?: { id: string; name: string }[];
  referenceItemsByKind?: Record<string, { id: string; name: string }[]>;
  tags?: { id: string; name: string }[];
}) {
  const items: ReferenceItem[] = REFERENCE_DEFS.map((def) => {
    if (def.id === "colors") {
      return {
        ...def,
        count: colors.length,
        values: colors.map((c) => ({ label: c.name, swatch: c.hex, href: "/settings/references/colors" })),
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
    if (def.id === "tags") {
      return {
        ...def,
        count: tags.length,
        values: tags.map((t) => ({ label: t.name, href: "/settings/references/tags" })),
        hasData: true,
      };
    }
    if (!NO_DATA_IDS.has(def.id)) {
      const values = referenceItemsByKind[def.id] ?? [];
      return {
        ...def,
        count: values.length,
        values: values.map((v) => ({ label: v.name, href: def.href })),
        hasData: true,
      };
    }
    return { ...def, hasData: false };
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ReferenceTile key={item.id} item={item} />
      ))}
    </div>
  );
}
