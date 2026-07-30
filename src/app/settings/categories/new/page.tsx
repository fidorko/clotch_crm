import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryForm } from "@/components/settings/CategoryForm";
import { listCategories } from "@/server/data/categories";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Нова категорія",
};

export default async function NewCategoryPage() {
  const categories = await listCategories(getDevTenantId());
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex justify-end">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Назад до списку
        </Link>
      </div>
      <DevBlockLabel name="CategoryForm" enabled={dev}>
        <CategoryForm category={null} allCategories={categories} />
      </DevBlockLabel>
    </div>
  );
}
