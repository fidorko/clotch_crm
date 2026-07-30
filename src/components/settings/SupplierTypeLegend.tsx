import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SupplierHintIllustration } from "@/components/settings/SupplierHintIllustration";
import { SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-options";

export function SupplierTypeLegend() {
  return (
    <>
      <Card className="gap-0 py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4 shrink-0 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Підказка</h2>
          </div>
          <SupplierHintIllustration />
          <p className="text-xs text-muted-foreground">
            Заповніть основну інформацію про постачальника. Це допоможе швидше створювати замовлення
            та відстежувати співпрацю.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <h2 className="text-sm font-semibold text-foreground">Тип постачальника</h2>
          {SUPPLIER_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-start gap-2.5">
              <span
                className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", option.colorClass)}
              >
                <option.icon className="size-3.5" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
