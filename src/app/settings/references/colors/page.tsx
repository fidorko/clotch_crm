import type { Metadata } from "next";
import Link from "next/link";
import { ColorsList } from "@/components/settings/ColorsList";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { listColors } from "@/server/data/colors";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Кольори",
};

export default async function ColorsPage() {
  const colors = await listColors(getDevTenantId());
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/settings" className="hover:text-foreground">
              Налаштування
            </Link>
            <span>/</span>
            <Link href="/settings?tab=references" className="hover:text-foreground">
              Довідники
            </Link>
            <span>/</span>
            <span className="text-foreground">Кольори</span>
          </nav>
          <HeaderActions />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Кольори</h1>
      </div>

      <DevBlockLabel name="ColorsList" enabled={dev}>
        <ColorsList colors={colors} />
      </DevBlockLabel>
    </div>
  );
}
