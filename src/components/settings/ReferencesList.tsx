import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Coins,
  Factory,
  Globe,
  Layers,
  Palette,
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

interface ReferenceValue {
  label: string;
  swatch?: string;
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
}

const MAX_VISIBLE_VALUES = 7;

const REFERENCE_DEFS: Omit<ReferenceItem, "count" | "values">[] = [
  {
    id: "collections",
    label: "Колекції",
    description: "Керування колекціями товарів",
    icon: Layers,
    href: "#",
    iconClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "seasons",
    label: "Сезон",
    description: "Сезони та періоди продажу",
    icon: CalendarDays,
    href: "#",
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "fabric-materials",
    label: "Тип тканини та матеріал",
    description: "Типи тканин та матеріали виробів",
    icon: Scissors,
    href: "#",
    iconClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  {
    id: "manufacturers",
    label: "Виробники",
    description: "Виробники та бренди товарів",
    icon: Factory,
    href: "#",
    iconClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    id: "suppliers",
    label: "Постачальники",
    description: "Постачальники та партнери",
    icon: Truck,
    href: "#",
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
    href: "#",
    iconClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    id: "countries",
    label: "Країни",
    description: "Країни виробництва та походження",
    icon: Globe,
    href: "#",
    iconClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  {
    id: "currencies",
    label: "Валюти",
    description: "Валюти та курси обміну",
    icon: Coins,
    href: "#",
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
    href: "#",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    id: "tags",
    label: "Теги",
    description: "Теги та мітки товарів",
    icon: Tags,
    href: "#",
    iconClass: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "fit",
    label: "Посадка",
    description: "Типи посадки одягу",
    icon: Shirt,
    href: "#",
    iconClass: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
  },
];

function ValueChip({ value }: { value: ReferenceValue }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
      {value.swatch && (
        <span
          className="size-2 shrink-0 rounded-full border border-border"
          style={{ backgroundColor: value.swatch }}
        />
      )}
      {value.label}
    </span>
  );
}

function ReferenceTile({ item }: { item: ReferenceItem }) {
  const visibleValues = item.values?.slice(0, MAX_VISIBLE_VALUES) ?? [];
  const hasMore = (item.values?.length ?? 0) > MAX_VISIBLE_VALUES;

  return (
    <Link
      href={item.href}
      className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start gap-3">
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
      </div>
      {visibleValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleValues.map((value) => (
            <ValueChip key={value.label} value={value} />
          ))}
          {hasMore && (
            <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
              …
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export function ReferencesList({ colors = [] }: { colors?: { name: string; hex: string }[] }) {
  const items: ReferenceItem[] = REFERENCE_DEFS.map((def) =>
    def.id === "colors"
      ? {
          ...def,
          count: colors.length,
          values: colors.map((c) => ({ label: c.name, swatch: c.hex })),
        }
      : def
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ReferenceTile key={item.id} item={item} />
      ))}
    </div>
  );
}
