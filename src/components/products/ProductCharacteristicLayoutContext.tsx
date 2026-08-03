"use client";

import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ResolvedCharacteristicRow } from "@/lib/products/characteristic-layout";
import { updateCharacteristicLayoutAction } from "@/app/products/characteristic-layout-actions";

type PanelKeys = { info: string[]; meta: string[] };

interface CharacteristicLayoutContextValue {
  infoRows: ResolvedCharacteristicRow[];
  metaRows: ResolvedCharacteristicRow[];
  editingLayout: boolean;
  isSavingLayout: boolean;
  startEditingLayout: () => void;
  cancelEditingLayout: () => void;
  saveLayout: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

const CharacteristicLayoutContext = createContext<CharacteristicLayoutContextValue | null>(null);

export function useCharacteristicLayout(): CharacteristicLayoutContextValue {
  const ctx = useContext(CharacteristicLayoutContext);
  if (!ctx) {
    throw new Error("useCharacteristicLayout має використовуватись всередині CharacteristicLayoutProvider");
  }
  return ctx;
}

/**
 * Стан режиму «Редагувати розташування характеристик» — раніше жив лише
 * всередині ProductGeneralTab; винесено в контекст (2026-08-03), бо кнопка
 * переїхала в ProductTabs (шапка вкладок, за прямою вказівкою людини), а сам
 * DndContext/панелі лишаються у ProductGeneralTab («Основне») — два різні
 * піддерева під одним `<Tabs>` у page.tsx, тому потрібне спільне джерело стану.
 */
export function CharacteristicLayoutProvider({
  dynamicRows,
  children,
}: {
  dynamicRows: { info: ResolvedCharacteristicRow[]; meta: ResolvedCharacteristicRow[] };
  children: ReactNode;
}) {
  const router = useRouter();
  const [editingLayout, setEditingLayout] = useState(false);
  const [draftKeys, setDraftKeys] = useState<PanelKeys | null>(null);
  const [isSavingLayout, startSavingLayout] = useTransition();

  const rowByKey = useMemo(() => {
    const map = new Map<string, ResolvedCharacteristicRow>();
    for (const row of [...dynamicRows.info, ...dynamicRows.meta]) map.set(row.key, row);
    return map;
  }, [dynamicRows]);

  const savedKeys: PanelKeys = useMemo(
    () => ({ info: dynamicRows.info.map((r) => r.key), meta: dynamicRows.meta.map((r) => r.key) }),
    [dynamicRows]
  );
  const activeKeys = draftKeys ?? savedKeys;
  const infoRows = activeKeys.info
    .map((key) => rowByKey.get(key))
    .filter((r): r is ResolvedCharacteristicRow => Boolean(r));
  const metaRows = activeKeys.meta
    .map((key) => rowByKey.get(key))
    .filter((r): r is ResolvedCharacteristicRow => Boolean(r));

  function startEditingLayout() {
    setDraftKeys(savedKeys);
    setEditingLayout(true);
  }

  function cancelEditingLayout() {
    setDraftKeys(null);
    setEditingLayout(false);
  }

  function containerOf(id: string): "info" | "meta" {
    if (id === "info-panel") return "info";
    if (id === "meta-panel") return "meta";
    return activeKeys.info.includes(id) ? "info" : "meta";
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overId = String(over.id);
    setDraftKeys((prev) => {
      const current = prev ?? savedKeys;
      const fromPanel = current.info.includes(activeKey) ? "info" : "meta";
      const toPanel = containerOf(overId);

      if (fromPanel === toPanel) {
        const list = current[fromPanel];
        const oldIndex = list.indexOf(activeKey);
        const newIndex = list.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return current;
        return { ...current, [fromPanel]: arrayMove(list, oldIndex, newIndex) };
      }

      const fromList = current[fromPanel].filter((k) => k !== activeKey);
      const toList = [...current[toPanel]];
      const insertAt = toList.indexOf(overId);
      toList.splice(insertAt === -1 ? toList.length : insertAt, 0, activeKey);
      return { ...current, [fromPanel]: fromList, [toPanel]: toList };
    });
  }

  function saveLayout() {
    const keys = draftKeys ?? savedKeys;
    startSavingLayout(async () => {
      await updateCharacteristicLayoutAction([
        ...keys.info.map((characteristicKey, position) => ({
          characteristicKey,
          panel: "info" as const,
          position,
        })),
        ...keys.meta.map((characteristicKey, position) => ({
          characteristicKey,
          panel: "meta" as const,
          position,
        })),
      ]);
      setDraftKeys(null);
      setEditingLayout(false);
      router.refresh();
    });
  }

  const value = useMemo<CharacteristicLayoutContextValue>(
    () => ({
      infoRows,
      metaRows,
      editingLayout,
      isSavingLayout,
      startEditingLayout,
      cancelEditingLayout,
      saveLayout,
      handleDragEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- функції стабільні за задумом (замикання на router/savedKeys, не окремий стан)
    [infoRows, metaRows, editingLayout, isSavingLayout]
  );

  return (
    <CharacteristicLayoutContext.Provider value={value}>{children}</CharacteristicLayoutContext.Provider>
  );
}
