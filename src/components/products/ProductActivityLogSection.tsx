"use client";

import { useState, useTransition } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadMoreProductActivityAction } from "@/app/products/[id]/actions";
import type { ProductActivityLogEntry } from "@/server/data/product-activity-log";

// Журнал подій товару (Технічні дані, modules/products.md): "Створено" —
// разова подія без деталей; "Відредаговано" — групи рядків з однаковим
// occurredAt (один виклик saveProduct), кожен рядок — одне змінене поле
// (стара → нова, той самий діф, що diffProductFields, server/data/).
function formatDateTimeSeconds(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

interface ActivityEventGroup {
  key: string;
  occurredAt: Date;
  eventType: "created" | "updated";
  actorName: string;
  changes: { key: string; label: string; oldValue: string; newValue: string }[];
}

function groupEntries(entries: ProductActivityLogEntry[]): ActivityEventGroup[] {
  const groups: ActivityEventGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    const sameGroup =
      last && last.eventType === entry.eventType && last.occurredAt.getTime() === entry.occurredAt.getTime();
    const change =
      entry.fieldKey && entry.fieldLabel
        ? { key: entry.fieldKey, label: entry.fieldLabel, oldValue: entry.oldValue ?? "—", newValue: entry.newValue ?? "—" }
        : null;

    if (sameGroup) {
      if (change) last.changes.push(change);
      continue;
    }
    groups.push({
      key: entry.id,
      occurredAt: entry.occurredAt,
      eventType: entry.eventType,
      actorName: entry.actorName,
      changes: change ? [change] : [],
    });
  }
  return groups;
}

function ActivityEventCard({ group }: { group: ActivityEventGroup }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {group.eventType === "created" ? "Товар створено" : "Товар відредаговано"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDateTimeSeconds(group.occurredAt)} · {group.actorName}
        </span>
      </div>
      {group.changes.length > 0 && (
        <ul className="flex flex-col gap-1">
          {group.changes.map((change) => (
            <li key={change.key} className="text-sm text-muted-foreground">
              <span className="text-foreground">{change.label}</span>: {change.oldValue}{" "}
              <span aria-hidden>→</span> {change.newValue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProductActivityLogSection({
  productId,
  initialEntries,
}: {
  productId: string;
  initialEntries: ProductActivityLogEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [exhausted, setExhausted] = useState(initialEntries.length === 0);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    const last = entries[entries.length - 1];
    if (!last) return;
    startTransition(async () => {
      const more = await loadMoreProductActivityAction(productId, last.occurredAt.toISOString());
      if (more.length === 0) {
        setExhausted(true);
        return;
      }
      setEntries((prev) => [...prev, ...more]);
    });
  }

  const groups = groupEntries(entries);

  return (
    <Card className="gap-3 py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4" />
          Журнал подій
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {groups.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">Подій ще немає</p>
        ) : (
          groups.map((group) => <ActivityEventCard key={group.key} group={group} />)
        )}
        {!exhausted && groups.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isPending}
            className="self-center"
          >
            Показати ще
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
