import type { Metadata } from "next";
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
    <DevBlockLabel name="CategoryForm" enabled={dev}>
      <CategoryForm category={null} allCategories={categories} />
    </DevBlockLabel>
  );
}
