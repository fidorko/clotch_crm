"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateUa, parseUaDate } from "@/lib/date-ua";

// "Гарний" календар замість голого текстового поля (пряма вказівка людини,
// warehouse-receiving.md — фільтри списку надходжень) — той самий контракт
// value/onChange, що DateInput (DD.MM.YYYY, "" — порожньо), тому місцями
// взаємозамінні; DateInput лишається там, де людина хоче саме швидкий ввід
// з клавіатури (маска), цей — де зручніше саме вибір по календарю.
export function DatePicker({
  value,
  onChange,
  placeholder = "Оберіть дату",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseUaDate(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none hover:border-muted-foreground/40 dark:bg-input/30",
          !selected && "text-muted-foreground",
          className
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{selected ? formatDateUa(selected) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          selected={selected}
          onSelect={(date) => {
            onChange(formatDateUa(date) ?? "");
            setOpen(false);
          }}
        />
        {selected && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mt-2 w-full rounded-md py-1 text-center text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Очистити
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
