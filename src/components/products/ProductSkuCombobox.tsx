"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { ProductSkuCatalogItem } from "@/server/data/product-skus";

// Пошуковий комбобокс "додати товар" — реальний каталог SKU тенанта
// (`listProductSkusCatalog`), одиничний вибір одразу додає рядок і скидає
// поле пошуку (не персистентне значення, як звичайний Select). Спершу жив як
// AddSkuCombobox лише в warehouse-receiving.md, перенесено сюди (ui-kit.md,
// правило 9.2 CLAUDE.md — 2 використання), коли знадобився й у формі нового
// замовлення (orders.md).
export function ProductSkuCombobox({
  catalog,
  excludeIds,
  onAdd,
}: {
  catalog: ProductSkuCatalogItem[];
  excludeIds: string[];
  onAdd: (item: ProductSkuCatalogItem) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const available = catalog.filter((item) => !excludeIds.includes(item.id));
  const byId = new Map(available.map((item) => [item.id, item]));
  const ids = available.map((item) => item.id);

  function handleValueChange(id: string | null) {
    if (!id) return;
    const item = byId.get(id);
    if (!item) return;
    onAdd(item);
    setInputValue("");
  }

  return (
    <Combobox
      items={ids}
      value={null}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      itemToStringLabel={(id: string) => {
        const item = byId.get(id);
        return item ? `${item.sku} ${item.productName} ${item.color} ${item.size} ${item.barcode ?? ""}` : id;
      }}
    >
      <ComboboxInputGroup className="w-80">
        <Plus className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
        <ComboboxInput placeholder="Назва, артикул, SKU або штрихкод..." className="pl-7" />
        <ComboboxTrigger />
      </ComboboxInputGroup>
      <ComboboxContent>
        {(id: string) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <ComboboxItem key={id} value={id}>
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: item.colorHex }}
              />
              <span className="truncate">
                {item.sku} — {item.productName}, {item.color}, {item.size}
              </span>
            </ComboboxItem>
          );
        }}
      </ComboboxContent>
    </Combobox>
  );
}
