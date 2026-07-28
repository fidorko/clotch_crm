import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  value: string;
  label: string;
  tone?: "default" | "warning";
}

export function StatTile({ icon: Icon, value, label, tone = "default" }: StatTileProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground",
          tone === "warning" && "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold text-foreground leading-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
