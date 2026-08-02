"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  HelpCircle,
  Loader2,
  MoveRight,
  PointerIcon,
  Search,
  Star,
  X,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CategoryCharacteristicOption } from "@/lib/categories/characteristic-options";
import { CharacteristicIcon } from "@/lib/categories/characteristic-icons";
import { updateCategoryPinnedCharacteristicsAction } from "@/app/settings/categories/characteristics-actions";

const VISIBLE_VALUES = 5;
type OptionByKey = Map<string, CategoryCharacteristicOption>;
type Section = CategoryCharacteristicOption["section"];

const SECTION_ORDER: Section[] = ["Характеристики товару", "Розміри", "Заміри", "Системні"];
const DEFAULT_COLLAPSED_SECTIONS: Section[] = ["Розміри", "Заміри"];

// "Розміри"/"Заміри" мають багато однотипних довідників (Взуття, Джинси...) з
// подібними назвами — без префікса розділу картки в правій панелі зливаються
// одна з одною (реальна плутанина, яку помітила людина).
function formatCharacteristicLabel(option: CategoryCharacteristicOption): string {
  if (option.section === "Розміри" || option.section === "Заміри") {
    return `${option.section}/${option.label}`;
  }
  return option.label;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Автозбереження без кнопки (conventions.md, 2026-08-02, свідома зміна за
 * прямою вказівкою людини): кожна завершена дія drag&drop (drop картки,
 * відкріплення ✕) — природна точка "commit", той самий принцип, що
 * blur/вибір в інших автозбережуваних формах. Каскад на дочірні категорії
 * (setCategoryPinnedCharacteristics) тепер теж спрацьовує без попередження —
 * раніше тут був Dialog-підступ "Зберегти зміни?", людина попросила прибрати
 * й це, усвідомлюючи ризик (decisions.md).
 */
export function CategoryCharacteristicsPicker({
  categoryId,
  options,
  initialPinnedKeys,
  hasChildCategories,
}: {
  categoryId: string;
  options: CategoryCharacteristicOption[];
  initialPinnedKeys: string[];
  hasChildCategories: boolean;
}) {
  const router = useRouter();
  const optionByKey: OptionByKey = useMemo(() => new Map(options.map((o) => [o.key, o])), [options]);

  const [pinnedKeys, setPinnedKeys] = useState(() => initialPinnedKeys.filter((k) => optionByKey.has(k)));
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const isFirstRender = useRef(true);

  const availableKeys = useMemo(
    () => options.map((o) => o.key).filter((k) => !pinnedKeys.includes(k)),
    [options, pinnedKeys]
  );
  const filteredAvailableKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableKeys;
    return availableKeys.filter((k) => optionByKey.get(k)!.label.toLowerCase().includes(q));
  }, [availableKeys, search, optionByKey]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      updateCategoryPinnedCharacteristicsAction(categoryId, pinnedKeys)
        .then(() => {
          setSaveStatus("saved");
          router.refresh();
        })
        .catch(() => setSaveStatus("error"));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categoryId/router стабільні, реагуємо лише на зміну самого списку
  }, [pinnedKeys]);

  function containerOf(id: string): "available" | "pinned" {
    if (id === "pinned-panel") return "pinned";
    if (id === "available-panel") return "available";
    return pinnedKeys.includes(id) ? "pinned" : "available";
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeKey = String(active.id);
    const overId = String(over.id);
    const fromContainer = pinnedKeys.includes(activeKey) ? "pinned" : "available";
    const toContainer = containerOf(overId);

    if (fromContainer === "available" && toContainer === "pinned") {
      setPinnedKeys((prev) => {
        const insertAt = prev.indexOf(overId);
        const next = [...prev];
        next.splice(insertAt === -1 ? next.length : insertAt, 0, activeKey);
        return next;
      });
    } else if (fromContainer === "pinned" && toContainer === "available") {
      setPinnedKeys((prev) => prev.filter((k) => k !== activeKey));
    } else if (fromContainer === "pinned" && toContainer === "pinned" && activeKey !== overId) {
      setPinnedKeys((prev) => {
        const oldIndex = prev.indexOf(activeKey);
        const newIndex = prev.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleUnpin(key: string) {
    setPinnedKeys((prev) => prev.filter((k) => k !== key));
  }

  const activeOption = activeId ? optionByKey.get(activeId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Закріплення характеристик</h2>
          <p className="text-sm text-muted-foreground">
            Перетягніть характеристики справа, які потрібно використовувати для цієї категорії.
            {hasChildCategories &&
              " Застосовується одразу до всіх підкатегорій і товарів у них — попередній власний вибір підкатегорій буде замінено."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Збереження…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5 text-success" />
              Збережено
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-destructive">Не вдалося зберегти</span>
          )}
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1 text-sm text-primary hover:underline">
              <HelpCircle className="size-4" />
              Як це працює?
            </TooltipTrigger>
            <TooltipContent>
              Перетягніть характеристику в праву панель, щоб закріпити її за категорією. Порядок карток
              праворуч визначає порядок показу. Кожна зміна зберігається сама, без кнопки.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <AvailablePanel
            keys={filteredAvailableKeys}
            totalCount={availableKeys.length}
            optionByKey={optionByKey}
            search={search}
            onSearchChange={setSearch}
          />
          <DragHint />
          <PinnedPanel keys={pinnedKeys} optionByKey={optionByKey} onUnpin={handleUnpin} />
        </div>

        <DragOverlay>{activeOption ? <DragGhost option={activeOption} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function DragHint() {
  return (
    <div className="hidden flex-col items-center justify-center gap-2 px-2 py-10 text-center lg:flex lg:w-32">
      <PointerIcon className="size-5 text-muted-foreground" />
      <MoveRight className="size-4 text-primary/60" strokeDasharray={4} />
      <p className="text-xs text-muted-foreground">
        Перетягніть характеристики сюди, щоб закріпити їх за категорією
      </p>
    </div>
  );
}

function AvailablePanel({
  keys,
  totalCount,
  optionByKey,
  search,
  onSearchChange,
}: {
  keys: string[];
  totalCount: number;
  optionByKey: OptionByKey;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: "available-panel" });
  const [collapsedSections, setCollapsedSections] = useState<Set<Section>>(
    () => new Set(DEFAULT_COLLAPSED_SECTIONS)
  );
  const isSearching = search.trim().length > 0;

  const keysBySection = useMemo(() => {
    const map = new Map<Section, string[]>();
    for (const key of keys) {
      const section = optionByKey.get(key)!.section;
      const list = map.get(section);
      if (list) list.push(key);
      else map.set(section, [key]);
    }
    return map;
  }, [keys, optionByKey]);

  const sortableItems = useMemo(() => {
    if (isSearching) return keys;
    return SECTION_ORDER.flatMap((section) =>
      collapsedSections.has(section) ? [] : (keysBySection.get(section) ?? [])
    );
  }, [isSearching, keys, keysBySection, collapsedSections]);

  function toggleSection(section: Section) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold whitespace-nowrap text-foreground">Доступні характеристики</h3>
        <div className="relative w-40">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Пошук..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div ref={setNodeRef} className="flex min-h-40 flex-col gap-1.5">
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          {isSearching
            ? keys.map((key) => <AvailableRow key={key} option={optionByKey.get(key)!} />)
            : SECTION_ORDER.map((section) => {
                const sectionKeys = keysBySection.get(section);
                if (!sectionKeys || sectionKeys.length === 0) return null;
                const collapsed = collapsedSections.has(section);
                return (
                  <div key={section} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSection(section)}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-sm font-bold tracking-wide text-foreground uppercase hover:bg-muted/70"
                    >
                      {collapsed ? (
                        <ChevronRight className="size-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="size-3.5 shrink-0" />
                      )}
                      <span>{section}</span>
                      <Badge variant="secondary">{sectionKeys.length}</Badge>
                    </button>
                    {!collapsed && (
                      <div className="flex flex-col gap-1.5 pl-1">
                        {sectionKeys.map((key) => (
                          <AvailableRow key={key} option={optionByKey.get(key)!} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
        </SortableContext>
        {keys.length === 0 && totalCount === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Усі характеристики закріплені</p>
        )}
        {keys.length === 0 && totalCount > 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Нічого не знайдено</p>
        )}
      </div>
    </div>
  );
}

function AvailableRow({ option }: { option: CategoryCharacteristicOption }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex h-11 cursor-grab items-center gap-2.5 rounded-xl border border-transparent px-2.5 hover:bg-muted active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <CharacteristicIcon option={option} className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-base font-bold text-foreground">{option.label}</span>
      <Badge variant="secondary">{option.values.length}</Badge>
    </div>
  );
}

function PinnedPanel({
  keys,
  optionByKey,
  onUnpin,
}: {
  keys: string[];
  optionByKey: OptionByKey;
  onUnpin: (key: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pinned-panel" });
  const resolvedKeys = keys.filter((k) => optionByKey.has(k));

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors duration-200",
        isOver ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">
          Закріплені характеристики ({resolvedKeys.length})
        </h3>
        <p className="text-xs text-muted-foreground">
          Тільки ці характеристики будуть доступні для вибору значень.
        </p>
      </div>

      <div ref={setNodeRef} className="flex min-h-40 flex-col gap-2">
        <SortableContext items={resolvedKeys} strategy={verticalListSortingStrategy}>
          {resolvedKeys.map((key) => (
            <PinnedCard key={key} option={optionByKey.get(key)!} onUnpin={() => onUnpin(key)} />
          ))}
        </SortableContext>
        {resolvedKeys.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Перетягніть характеристики сюди, щоб закріпити їх за категорією
          </div>
        )}
      </div>

      {resolvedKeys.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
          <Star className="size-3.5 shrink-0 text-muted-foreground" />
          Показуватимуться у картці товару та будуть доступні для фільтрації.
        </div>
      )}
    </div>
  );
}

function PinnedCard({
  option,
  onUnpin,
}: {
  option: CategoryCharacteristicOption;
  onUnpin: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.key,
  });
  const visible = option.values.slice(0, VISIBLE_VALUES);
  const rest = option.values.slice(VISIBLE_VALUES);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 transition-shadow duration-200",
        isDragging && "opacity-40"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label="Перетягнути"
      >
        <GripVertical className="size-4" />
      </button>
      <CharacteristicIcon option={option} className="size-4 shrink-0 text-muted-foreground" />
      <span
        className="w-40 shrink-0 truncate text-base font-bold text-foreground"
        title={formatCharacteristicLabel(option)}
      >
        {formatCharacteristicLabel(option)}
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {visible.map((value) => (
          <Badge key={value.id} variant="outline">
            {value.label}
          </Badge>
        ))}
        {rest.length > 0 && (
          <Popover>
            <PopoverTrigger className={cn(badgeVariants({ variant: "secondary" }), "cursor-pointer")}>
              +{rest.length}
            </PopoverTrigger>
            <PopoverContent>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Усі значення ({option.values.length})
              </p>
              <div className="flex max-h-64 flex-wrap gap-1 overflow-y-auto">
                {option.values.map((value) => (
                  <Badge key={value.id} variant="outline">
                    {value.label}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Badge variant="secondary" className="shrink-0">
        {option.values.length}
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={onUnpin}
        aria-label={`Відкріпити ${formatCharacteristicLabel(option)}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function DragGhost({ option }: { option: CategoryCharacteristicOption }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-background px-3 py-2 shadow-lg">
      <GripVertical className="size-4 text-muted-foreground" />
      <CharacteristicIcon option={option} className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{formatCharacteristicLabel(option)}</span>
      <Badge variant="secondary">{option.values.length}</Badge>
    </div>
  );
}
