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
}

const REFERENCE_ITEMS: ReferenceItem[] = [
  { id: "collections", label: "Колекції", icon: Layers },
  { id: "seasons", label: "Сезон", icon: CalendarDays },
  { id: "fabric-materials", label: "Тип тканини та матеріал", icon: Scissors },
  { id: "manufacturers", label: "Виробники", icon: Factory },
  { id: "suppliers", label: "Постачальники", icon: Truck },
  { id: "care-instructions", label: "Інструкція по догляду", icon: WashingMachine },
  { id: "measurements", label: "Розміри та заміри", icon: Ruler },
  { id: "brands", label: "Бренди", icon: Tag },
  { id: "countries", label: "Країни", icon: Globe },
  { id: "currencies", label: "Валюти", icon: Coins },
  { id: "colors", label: "Кольори", icon: Palette },
  { id: "units", label: "Одиниці виміру", icon: Scale },
  { id: "tags", label: "Теги", icon: Tags },
  { id: "fit", label: "Посадка", icon: Shirt },
];

export function ReferencesList() {
  return (
    <Card className="gap-0 py-2">
      <CardContent className="flex flex-col divide-y divide-border px-0">
        {REFERENCE_ITEMS.map((item) => (
          <Link
            key={item.id}
            href="#"
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
