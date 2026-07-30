"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "storefront", label: "Вітрина магазину" },
  { value: "general", label: "Загальні" },
  { value: "categories", label: "Категорії товару" },
  { value: "orders", label: "Замовлення" },
  { value: "references", label: "Довідники" },
  { value: "warehouses", label: "Склади" },
  { value: "delivery", label: "Доставка" },
  { value: "payment", label: "Оплата" },
  { value: "plan", label: "Тарифний план" },
];

export function SettingsTabs() {
  return (
    <TabsList
      variant="line"
      className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent px-6 py-0"
    >
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.value}
          value={tab.value}
          className="flex-none rounded-none px-1 py-3.5 text-sm font-medium text-muted-foreground after:-bottom-2.25 after:bg-primary hover:text-foreground dark:hover:text-foreground data-active:font-semibold data-active:text-primary"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
