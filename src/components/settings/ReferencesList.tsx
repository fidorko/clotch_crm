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
import { Card, CardContent } from "@/components/ui/card";

interface ReferenceItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const REFERENCE_ITEMS: ReferenceItem[] = [
  { id: "collections", label: "Колекції", icon: Layers, href: "#" },
  { id: "seasons", label: "Сезон", icon: CalendarDays, href: "#" },
  { id: "fabric-materials", label: "Тип тканини та матеріал", icon: Scissors, href: "#" },
  { id: "manufacturers", label: "Виробники", icon: Factory, href: "#" },
  { id: "suppliers", label: "Постачальники", icon: Truck, href: "#" },
  { id: "care-instructions", label: "Інструкція по догляду", icon: WashingMachine, href: "#" },
  { id: "measurements", label: "Розміри та заміри", icon: Ruler, href: "#" },
  { id: "brands", label: "Бренди", icon: Tag, href: "#" },
  { id: "countries", label: "Країни", icon: Globe, href: "#" },
  { id: "currencies", label: "Валюти", icon: Coins, href: "#" },
  { id: "colors", label: "Кольори", icon: Palette, href: "/settings/references/colors" },
  { id: "units", label: "Одиниці виміру", icon: Scale, href: "#" },
  { id: "tags", label: "Теги", icon: Tags, href: "#" },
  { id: "fit", label: "Посадка", icon: Shirt, href: "#" },
];

export function ReferencesList() {
  return (
    <Card className="gap-0 py-2">
      <CardContent className="flex flex-col divide-y divide-border px-0">
        {REFERENCE_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent/50"
          >
            <item.icon className="size-4.5 shrink-0 text-muted-foreground" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
