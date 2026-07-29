import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  /** "left" — фіксована ширина лейбла, значення зліва одразу після (картки-панелі). "right" (за замовч.) — значення притиснуте праворуч (вузькі колонки, напр. деталі SKU). */
  align?: "left" | "right";
  className?: string;
}

export function DetailRow({ label, value, emphasis, align = "right", className }: DetailRowProps) {
  if (align === "left") {
    return (
      <div className={cn("flex items-start gap-4 py-1.5", className)}>
        <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex-1 text-sm text-foreground", emphasis && "font-semibold")}>
          {value}
        </span>
      </div>
    );
  }

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
