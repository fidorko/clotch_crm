"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Єдиний реально робочий пункт у HeaderActions (решта — поки декоративні
 * заглушки без бекенду). Стан читається напряму з document.documentElement
 * через useSyncExternalStore — офіційно рекомендований спосіб синхронізації
 * із зовнішнім (не-React) джерелом стану без гідратаційного розсинхрону:
 * getServerSnapshot завжди false (як і на клієнті до гідратації), реальне
 * значення підтягується автоматично одразу після монтування, без setState
 * усередині useEffect (react-hooks/set-state-in-effect). Клас .dark на
 * <html> спершу виставляє інлайн-скрипт у layout.tsx (next/script,
 * beforeInteractive) — без нього була б помітна спалахка світлої теми.
 */
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setDark(next: boolean) {
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem("theme", next ? "dark" : "light");
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => setDark(!isDark)}
            aria-label={isDark ? "Світла тема" : "Темна тема"}
            className="flex size-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        {isDark ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Світла тема" : "Темна тема"}</TooltipContent>
    </Tooltip>
  );
}
