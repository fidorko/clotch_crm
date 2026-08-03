"use client";

import { LayoutGrid, X } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCharacteristicLayout } from "@/components/products/ProductCharacteristicLayoutContext";

const tabs = [
  { value: "general", label: "Основне" },
  { value: "technical", label: "Технічні дані" },
  { value: "sizes", label: "Розміри та заміри" },
  { value: "stock", label: "Залишки" },
  { value: "supply", label: "Постачання" },
  { value: "sales", label: "Продажі" },
  { value: "photo", label: "Фото" },
  { value: "description", label: "Опис" },
  { value: "files", label: "Файли" },
  { value: "history", label: "Історія" },
];

// Кнопка «Редагувати розташування характеристик» — перенесена сюди з
// ProductGeneralTab (2026-08-03, за прямою вказівкою людини): сам DndContext і
// панелі лишаються на вкладці «Основне», стан — у ProductCharacteristicLayoutContext,
// спільному для обох. Кнопка видима на будь-якій вкладці (тут немає простого способу
// дізнатись активну вкладку без переведення Tabs на контрольований режим) —
// відкритий пункт, products.md.
export function ProductTabs() {
  const { editingLayout, isSavingLayout, startEditingLayout, cancelEditingLayout, saveLayout } =
    useCharacteristicLayout();

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-6">
      <TabsList
        variant="line"
        className="h-auto w-fit justify-start gap-6 rounded-none border-b-0 bg-transparent p-0"
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
      {editingLayout ? (
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={cancelEditingLayout} disabled={isSavingLayout}>
            <X className="size-3.5" />
            Скасувати
          </Button>
          <Button type="button" size="sm" onClick={saveLayout} disabled={isSavingLayout}>
            Зберегти розташування
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={startEditingLayout} className="shrink-0">
          <LayoutGrid className="size-3.5" />
          Редагувати розташування характеристик
        </Button>
      )}
    </div>
  );
}
