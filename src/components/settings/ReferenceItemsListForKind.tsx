"use client";

import { useRouter } from "next/navigation";
import { SimpleReferenceItemsList } from "@/components/settings/SimpleReferenceItemsList";
import type { ReferenceItemKind } from "@/lib/constants/reference-item-kinds";
import type { ReferenceItemRow } from "@/server/data/reference-items";
import {
  createReferenceItemAction,
  deleteReferenceItemAction,
  updateReferenceItemAction,
} from "@/app/settings/references/[kind]/actions";

export function ReferenceItemsListForKind({
  kind,
  items,
}: {
  kind: ReferenceItemKind;
  items: ReferenceItemRow[];
}) {
  const router = useRouter();

  return (
    <SimpleReferenceItemsList
      items={items.map((item) => ({ id: item.id, name: item.name }))}
      onCreate={async (name) => {
        const item = await createReferenceItemAction(kind, name);
        router.refresh();
        return item;
      }}
      onUpdate={async (id, name) => {
        await updateReferenceItemAction(kind, id, name);
        router.refresh();
      }}
      onDelete={async (id) => {
        await deleteReferenceItemAction(kind, id);
        router.refresh();
      }}
    />
  );
}
