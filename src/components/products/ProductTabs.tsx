"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "general", label: "Основне" },
  { value: "sizes", label: "Розміри та заміри" },
  { value: "stock", label: "Залишки" },
  { value: "supply", label: "Постачання" },
  { value: "sales", label: "Продажі" },
  { value: "photo", label: "Фото" },
  { value: "description", label: "Опис" },
  { value: "files", label: "Файли" },
  { value: "history", label: "Історія" },
];

export function ProductTabs() {
  return (
    <TabsList
      variant="line"
      className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent px-6 py-0"
    >
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="flex-none rounded-none px-1 py-3.5 text-sm font-medium text-muted-foreground after:-bottom-2.25 after:bg-primary hover:text-muted-foreground dark:hover:text-muted-foreground data-active:font-semibold data-active:text-primary"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
