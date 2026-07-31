"use client";

import { useRouter } from "next/navigation";
import { SimpleReferenceItemsList } from "@/components/settings/SimpleReferenceItemsList";
import type { TagRow } from "@/server/data/tags";
import { createTagAction, deleteTagAction, updateTagAction } from "@/app/settings/references/tags/actions";

export function TagsReferenceList({ tags }: { tags: TagRow[] }) {
  const router = useRouter();

  return (
    <SimpleReferenceItemsList
      items={tags.map((tag) => ({ id: tag.id, name: tag.label }))}
      addLabel="Додати тег"
      createDefaultName="новий-тег"
      emptyHint="Тегів ще немає — натисніть «Додати тег»"
      deleteWarning="Тег буде прибрано з усіх товарів, де він використаний."
      onCreate={async (name) => {
        const tag = await createTagAction(name);
        router.refresh();
        return tag;
      }}
      onUpdate={async (id, name) => {
        await updateTagAction(id, name);
        router.refresh();
      }}
      onDelete={async (id) => {
        await deleteTagAction(id);
        router.refresh();
      }}
    />
  );
}
