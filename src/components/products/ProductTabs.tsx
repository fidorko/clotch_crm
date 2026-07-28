"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "general", label: "Основне" },
  { value: "skus", label: "Варіанти (SKU)" },
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
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent px-6 py-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none border-b-2 border-transparent px-2 py-3 text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
