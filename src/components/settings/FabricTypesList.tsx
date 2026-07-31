"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FabricTypeDetail } from "@/server/data/fabric-types";

const PAGE_SIZE = 10;

export function FabricTypesList({
  fabricTypes,
  selectedId,
  onSelect,
}: {
  fabricTypes: FabricTypeDetail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return fabricTypes;
    return fabricTypes.filter((f) => f.name.toLowerCase().includes(query));
  }, [fabricTypes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  return (
    <div className="flex w-full flex-col gap-3 lg:w-80 lg:shrink-0">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Пошук типу тканини..."
          className="pl-8"
        />
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {pageItems.map((fabricType) => (
          <button
            key={fabricType.id}
            type="button"
            onClick={() => onSelect(fabricType.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/60",
              selectedId === fabricType.id && "border-l-2 border-l-primary bg-primary/5"
            )}
          >
            {fabricType.schemaImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fabricType.schemaImageUrl}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {fabricType.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{fabricType.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {fabricType.composition.length > 0
                  ? fabricType.composition.map((c) => c.name).join(", ")
                  : "Склад не вказано"}
              </span>
            </span>
          </button>
        ))}
        {pageItems.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            {fabricTypes.length === 0 ? "Типів тканини ще немає" : "Нічого не знайдено"}
          </p>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Показано {rangeStart}–{rangeEnd} з {filtered.length}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted disabled:cursor-default disabled:opacity-40"
                aria-label="Попередня сторінка"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "flex size-6 cursor-pointer items-center justify-center rounded-md",
                    n === currentPage ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-muted disabled:cursor-default disabled:opacity-40"
                aria-label="Наступна сторінка"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
