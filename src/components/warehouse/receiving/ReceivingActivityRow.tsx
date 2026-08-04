import Link from "next/link";
import { Check, Shirt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MOCK_DISCREPANCIES_COUNT,
  MOCK_LAST_SCAN,
  MOCK_RECEIVING_PROGRESS,
} from "@/lib/mocks/receiving";

export function ReceivingActivityRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="gap-3 p-4">
        <CardContent className="flex flex-col gap-3 p-0">
          <span className="text-sm font-semibold text-foreground">Останнє сканування</span>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-foreground text-background">
              <Shirt className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{MOCK_LAST_SCAN.sku}</span>
              <span className="truncate text-xs text-muted-foreground">
                {MOCK_LAST_SCAN.productName}, {MOCK_LAST_SCAN.color}, {MOCK_LAST_SCAN.size}
              </span>
            </div>
            <Badge variant="success" className="gap-1">
              <Check className="size-3" />
              Додано
            </Badge>
            <span className="shrink-0 text-xs text-muted-foreground">{MOCK_LAST_SCAN.time}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-3 p-4">
        <CardContent className="flex flex-col gap-2 p-0">
          <span className="text-sm font-semibold text-foreground">Прогрес приймання</span>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Прийнято {MOCK_RECEIVING_PROGRESS.receivedUnits} з {MOCK_RECEIVING_PROGRESS.expectedUnits} од.
            </span>
            <span className="font-medium text-foreground">{MOCK_RECEIVING_PROGRESS.fillPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent-foreground"
              style={{ width: `${MOCK_RECEIVING_PROGRESS.fillPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-3 p-4">
        <CardContent className="flex flex-col gap-2 p-0">
          <span className="text-sm font-semibold text-foreground">Розбіжності</span>
          <span className="text-2xl font-semibold text-destructive leading-tight">
            {MOCK_DISCREPANCIES_COUNT}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs text-destructive">
              {MOCK_DISCREPANCIES_COUNT} позиції з розбіжностями
            </span>
            <Link href="#" className="text-xs font-medium text-accent-foreground hover:underline">
              Переглянути
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
