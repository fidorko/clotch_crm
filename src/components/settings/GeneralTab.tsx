import { GeneralInfoCard } from "@/components/settings/GeneralInfoCard";
import { CompanyLegalEntitiesCard } from "@/components/settings/CompanyLegalEntitiesCard";
import type { GeneralSettingsRow } from "@/server/data/general-settings";
import type { CompanyLegalEntityRow } from "@/server/data/company-legal-entities";

/** Розділ «Загальні» (settings → Загальні) — перша плитка 70% ширини («Основні дані»), друга — «Мої ФОП та ТОВ» (пряма вказівка людини, settings-general.md). */
export function GeneralTab({
  settings,
  legalEntities,
}: {
  settings: GeneralSettingsRow | null;
  legalEntities: CompanyLegalEntityRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
      <GeneralInfoCard settings={settings} />
      <CompanyLegalEntitiesCard entities={legalEntities} />
    </div>
  );
}
