import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SupplierForm } from "@/components/settings/SupplierForm";
import { getSupplierById } from "@/server/data/suppliers";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getSupplierById(getDevTenantId(), id);
  return { title: detail?.supplier.name ?? "Постачальника не знайдено" };
}

export default async function EditSupplierPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getSupplierById(getDevTenantId(), id);
  if (!detail) notFound();
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <DevBlockLabel name="SupplierForm" enabled={dev}>
      <SupplierForm detail={detail} />
    </DevBlockLabel>
  );
}
