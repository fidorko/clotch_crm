import type { Metadata } from "next";
import Link from "next/link";
import { TagsReferenceList } from "@/components/settings/TagsReferenceList";
import { listTags } from "@/server/data/tags";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Теги",
};

export default async function TagsPage() {
  const tags = await listTags(getDevTenantId());
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground">
            Налаштування
          </Link>
          <span>/</span>
          <Link href="/settings?tab=references" className="hover:text-foreground">
            Довідники
          </Link>
          <span>/</span>
          <span className="text-foreground">Теги</span>
        </nav>
        <h1 className="text-2xl font-semibold text-foreground">Теги</h1>
      </div>

      <DevBlockLabel name="TagsReferenceList" enabled={dev}>
        <TagsReferenceList tags={tags} />
      </DevBlockLabel>
    </div>
  );
}
