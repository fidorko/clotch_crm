"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyLegalEntityFormDialog } from "@/components/settings/CompanyLegalEntityFormDialog";
import type { CompanyLegalEntityRow } from "@/server/data/company-legal-entities";

const TYPE_LABEL: Record<CompanyLegalEntityRow["type"], string> = { fop: "ФОП", tov: "ТОВ" };
const TYPE_COLOR: Record<CompanyLegalEntityRow["type"], string> = {
  fop: "bg-success text-success-foreground",
  tov: "bg-primary text-primary-foreground",
};

/**
 * «Мої ФОП та ТОВ» (settings → Загальні, друга плитка) — за зразком-скріном
 * людини: іконка-абревіатура типу + назва + ЄДРПОУ + статус-бейдж + шеврон.
 * Клік по рядку відкриває той самий попап редагування (Тип/Назва/ЄДРПОУ/
 * Статус) — повних банківських реквізитів не запитувалось, лише цей набір
 * полів (settings-general.md, відкритий пункт).
 */
export function CompanyLegalEntitiesCard({ entities }: { entities: CompanyLegalEntityRow[] }) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Мої ФОП та ТОВ</h2>
            <p className="text-xs text-muted-foreground">Керуйте своїми компаніями та реквізитами</p>
          </div>
          <CompanyLegalEntityFormDialog
            onSaved={refresh}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Додати компанію">
                <Plus className="size-4" />
              </Button>
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          {entities.map((entity) => (
            <CompanyLegalEntityFormDialog
              key={entity.id}
              entity={entity}
              onSaved={refresh}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${TYPE_COLOR[entity.type]}`}
                  >
                    {TYPE_LABEL[entity.type]}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{entity.name}</span>
                    <span className="text-xs text-muted-foreground">ЄДРПОУ {entity.edrpou}</span>
                  </span>
                  <Badge variant={entity.isActive ? "success" : "secondary"}>
                    {entity.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              }
            />
          ))}
          {entities.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Компаній ще немає — натисніть «+», щоб додати ФОП або ТОВ
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
