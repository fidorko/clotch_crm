import type { Metadata } from "next";
import { SupplierForm } from "@/components/settings/SupplierForm";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = {
  title: "Додати постачальника",
};

export default function NewSupplierPage() {
  const dev = DEV_BLOCK_LABELS.settings;

  return (
    <DevBlockLabel name="SupplierForm" enabled={dev}>
      <SupplierForm detail={null} />
    </DevBlockLabel>
  );
}
