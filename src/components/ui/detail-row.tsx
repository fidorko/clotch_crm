import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  className?: string;
}

export function DetailRow({ label, value, emphasis, className }: DetailRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-1.5", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right text-sm text-foreground",
          emphasis && "font-semibold"
        )}
      >
        {value}
      </span>
    </div>
  );
}
