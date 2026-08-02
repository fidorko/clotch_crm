"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Той самий UI, що колишній фіксований TagsSection у ProductMetaPanel (чипи +
 * dropdown з чекбоксами + вільний ввід нового тегу), але тепер — динамічна
 * характеристика: показується лише коли "Теги" закріплені за категорією,
 * доступні для вибору теги — реальні значення `custom_characteristic_values`
 * (system_key="tags"), не хардкод-список. Зберігання не змінилось —
 * form.tags (масив лейблів), той самий syncProductTags (find-or-create).
 */
export function TagsRow({
  label,
  availableTags,
  tags,
  onChange,
}: {
  label: string;
  availableTags: { id: string; label: string }[];
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [customTag, setCustomTag] = useState("");

  function toggle(tagLabel: string) {
    onChange(tags.includes(tagLabel) ? tags.filter((t) => t !== tagLabel) : [...tags, tagLabel]);
  }

  function remove(tagLabel: string) {
    onChange(tags.filter((t) => t !== tagLabel));
  }

  function addCustom() {
    const value = customTag.trim();
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
    setCustomTag("");
  }

  return (
    <div className="py-2">
      <p className="mb-2 text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline" className="gap-1 pr-1.5">
            {tag}
            <button
              type="button"
              aria-label={`Прибрати тег ${tag}`}
              className="rounded-full hover:bg-muted"
              onClick={() => remove(tag)}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="mt-1.5 flex items-center gap-1 text-sm text-primary hover:underline">
          <Plus className="size-3.5" />
          Додати тег
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Оберіть теги</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTags.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Ще немає жодного тегу</div>
            ) : (
              availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag.id}
                  checked={tags.includes(tag.label)}
                  onCheckedChange={() => toggle(tag.label)}
                >
                  {tag.label}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <div className="flex items-center gap-1.5 p-1.5">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Свій тег"
              className="h-7 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
                if (e.key !== "Escape") {
                  e.stopPropagation();
                }
              }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addCustom}>
              Додати
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
