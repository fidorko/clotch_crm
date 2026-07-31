import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReferenceItemsListForKind } from "@/components/settings/ReferenceItemsListForKind";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { listReferenceItems } from "@/server/data/reference-items";
import { isReferenceItemKind, REFERENCE_ITEM_KIND_LABELS } from "@/lib/constants/reference-item-kinds";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

type PageProps = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kind } = await params;
  return { title: isReferenceItemKind(kind) ? REFERENCE_ITEM_KIND_LABELS[kind] : "Довідник" };
}

export default async function ReferenceItemsPage({ params }: PageProps) {
  const { kind } = await params;
  if (!isReferenceItemKind(kind)) notFound();

  const items = await listReferenceItems(getDevTenantId(), kind);
  const dev = DEV_BLOCK_LABELS.settings;
  const label = REFERENCE_ITEM_KIND_LABELS[kind];

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
            <span className="text-foreground">{label}</span>
          </nav>
          <HeaderActions />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{label}</h1>
      </div>

      <DevBlockLabel name="ReferenceItemsListForKind" enabled={dev}>
        <ReferenceItemsListForKind kind={kind} items={items} />
      </DevBlockLabel>
    </div>
  );
}
