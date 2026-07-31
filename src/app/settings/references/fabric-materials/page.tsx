import type { Metadata } from "next";
import { FabricMaterialsWorkspace } from "@/components/settings/FabricMaterialsWorkspace";
import { listCareInstructions } from "@/server/data/care-instructions";
import { listFabricTypesWithDetails } from "@/server/data/fabric-types";
import { listMaterials } from "@/server/data/materials";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";
import { DevBlockLabel } from "@/components/dev/DevBlockLabel";
import { DEV_BLOCK_LABELS } from "@/lib/dev/dev-flags";

export const metadata: Metadata = { title: "Текстильні матеріали" };

export default async function FabricMaterialsPage() {
  const tenantId = getDevTenantId();
  const [fabricTypes, materials, careInstructions] = await Promise.all([
    listFabricTypesWithDetails(tenantId),
    listMaterials(tenantId),
    listCareInstructions(tenantId),
  ]);

  return (
    <DevBlockLabel name="FabricMaterialsWorkspace" enabled={DEV_BLOCK_LABELS.settings}>
      <FabricMaterialsWorkspace fabricTypes={fabricTypes} materials={materials} careInstructions={careInstructions} />
    </DevBlockLabel>
  );
}
