import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryForm } from "@/components/settings/CategoryForm";
import { getCategoryById, listCategories } from "@/server/data/categories";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await getCategoryById(getDevTenantId(), id);
  return { title: category?.name ?? "Категорію не знайдено" };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const tenantId = getDevTenantId();
  const [category, categories] = await Promise.all([
    getCategoryById(tenantId, id),
    listCategories(tenantId),
  ]);

  if (!category) notFound();
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
        <CategoryForm category={category} allCategories={categories} />
      </DevBlockLabel>
    </div>
  );
}
