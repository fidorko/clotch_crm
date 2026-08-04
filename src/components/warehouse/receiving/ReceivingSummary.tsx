import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryStat {
  label: string;
  value: number;
  tone?: "default" | "destructive";
}

export function ReceivingSummary({ stats }: { stats: SummaryStat[] }) {
  return (
    <Card className="gap-3 p-4">
      <CardContent className="flex flex-col gap-3 p-0">
        <span className="text-lg font-semibold text-foreground">Підсумок</span>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-border py-2.5"
            >
              <span
                className={cn(
                  "text-lg font-semibold leading-tight",
                  stat.tone === "destructive" ? "text-destructive" : "text-foreground"
                )}
              >
                {stat.value}
              </span>
              <span className="text-center text-[0.7rem] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
