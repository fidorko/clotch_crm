"use client";

import { useRef, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@/components/ui/combobox";

/**
 * Пошуковий комбобокс проти живого API НП (місто/відділення/вулиця) — той
 * самий контрольований Combobox, що ProductSkuCombobox (`value={null}`
 * завжди — транзитний пошук, не персистентний вибір), лише items оновлюється
 * з сервера через debounce, не з готового каталогу. Base UI сам скидає текст
 * інпуту після вибору, коли value лишається null (мітка "Нічого не знайдено"
 * — сумісний патерн), тому обраний варіант показуємо окремим рядком під
 * полем, а не намагаємось повернути його назад у текст пошуку.
 * Спершу жив лише в DeliveryMethodSenderFields.tsx (settings-delivery.md),
 * перенесено сюди (ui-kit.md, правило 9.2 CLAUDE.md — 2 використання), коли
 * знадобився для отримувача у формі нового замовлення (orders.md).
 */
export function NpSearchCombobox({
  selectedLabel,
  placeholder,
  disabled,
  onSearch,
  onSelect,
}: {
  selectedLabel: string;
  placeholder: string;
  disabled?: boolean;
  onSearch: (
    query: string
  ) => Promise<{ ok: true; items: { ref: string; name: string }[] } | { ok: false; message: string }>;
  onSelect: (item: { ref: string; name: string }) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<{ ref: string; name: string }[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInputValueChange(next: string) {
    setInputValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(next).then((result) => setItems(result.ok ? result.items : []));
    }, 300);
  }

  const byRef = new Map(items.map((i) => [i.ref, i]));
  const refs = items.map((i) => i.ref);

  function handleValueChange(ref: string | null) {
    if (!ref) return;
    const item = byRef.get(ref);
    if (!item) return;
    onSelect(item);
    setInputValue("");
    setItems([]);
  }

  return (
    <div className="flex flex-col gap-1">
      <Combobox
        items={refs}
        value={null}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        itemToStringLabel={(ref: string) => byRef.get(ref)?.name ?? ref}
        disabled={disabled}
      >
        <ComboboxInputGroup>
          <ComboboxInput placeholder={placeholder} />
          <ComboboxTrigger />
        </ComboboxInputGroup>
        <ComboboxContent>
          {(ref: string) => {
            const item = byRef.get(ref);
            if (!item) return null;
            return (
              <ComboboxItem key={ref} value={ref}>
                {item.name}
              </ComboboxItem>
            );
          }}
        </ComboboxContent>
      </Combobox>
      {selectedLabel && <p className="text-xs text-muted-foreground">Обрано: {selectedLabel}</p>}
    </div>
  );
}
