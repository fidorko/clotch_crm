import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Поле вводу з іконкою-префіксом зліва (той самий патерн, що пошук у
// CategoriesTab) — Веб-сайт/Телефон/Email у формі постачальника.
export function IconInput({
  icon: Icon,
  className,
  containerClassName,
  ...props
}: { icon: LucideIcon; containerClassName?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className={`relative ${containerClassName ?? ""}`}>
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input {...props} className={`pl-9 ${className ?? ""}`} />
    </div>
  );
}
