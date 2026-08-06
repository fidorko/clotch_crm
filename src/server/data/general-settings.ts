import { eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { generalSettings, type GeneralSettingsWorkHourEntry } from "@/server/db/schema";

export type GeneralSettingsRow = typeof generalSettings.$inferSelect;

export interface GeneralSettingsInput {
  name: string;
  website: string;
  email: string;
  contactPersonName: string;
  contactPersonPosition: string;
  contactPersonPhone: string;
  workHours: GeneralSettingsWorkHourEntry[];
}

/** null, поки тенант жодного разу не зберігав форму (singleton-рядок ще не створено). */
export async function getGeneralSettings(tenantId: string): Promise<GeneralSettingsRow | null> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.select().from(generalSettings).where(eq(generalSettings.tenantId, tenantId));
    return row ?? null;
  });
}

/** Insert-or-update одним запитом — перше збереження створює рядок, наступні оновлюють той самий. */
export async function upsertGeneralSettings(
  tenantId: string,
  input: GeneralSettingsInput
): Promise<GeneralSettingsRow> {
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .insert(generalSettings)
      .values({ tenantId, ...input })
      .onConflictDoUpdate({
        target: generalSettings.tenantId,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return row;
  });
}
