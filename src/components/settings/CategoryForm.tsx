"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CategoryTreeSelect } from "@/components/categories/CategoryTreeSelect";
import { CategoryFormHeader } from "@/components/settings/CategoryFormHeader";
import { CategoryCharacteristicsPicker } from "@/components/settings/CategoryCharacteristicsPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryRow } from "@/server/data/categories";
import type { CategoryCharacteristicOption } from "@/lib/categories/characteristic-options";
import { isDescendantCategory } from "@/lib/categories/tree";
import { resolveInheritedField } from "@/lib/categories/inheritance";
import {
  createCategoryAction,
  updateCategoryAction,
  uploadCategoryImageAction,
} from "@/app/settings/categories/actions";

export function CategoryForm({
  category,
  allCategories,
  characteristics,
}: {
  category: CategoryRow | null;
  allCategories: CategoryRow[];
  characteristics?: {
    options: CategoryCharacteristicOption[];
    pinnedKeys: string[];
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // "Основне" — автозбереження (conventions.md), лише для вже наявної категорії
  // (на /new явна кнопка "Створити категорію" лишається — це дія створення, не
  // редагування). saveStatus — для індикатора в CategoryFormHeader.
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const isFirstRender = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<"general" | "characteristics">("general");

  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "root");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(category?.imageUrl ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // null = успадковано від батьківської категорії (не задано на цій) — щойно
  // людина торкається перемикача, значення стає власним назавжди (без окремого
  // "скинути до успадкованого" — не просили). Перемикач показує ефективне
  // значення (own ?? inherited), а не сире, інакше вимкнена в батька категорія
  // виглядала б увімкненою на дочірній, поки її не збережуть.
  const [ownIsActive, setOwnIsActive] = useState<boolean | null>(category?.isActive ?? null);
  const [ownShowInStorefrontSection, setOwnShowInStorefrontSection] = useState<boolean | null>(
    category?.showInStorefrontSection ?? null
  );
  const [ownShowInHeaderMenu, setOwnShowInHeaderMenu] = useState<boolean | null>(
    category?.showInHeaderMenu ?? null
  );
  const inheritFromId = parentId === "root" ? null : parentId;
  const isActive = ownIsActive ?? resolveInheritedField(allCategories, inheritFromId, "isActive") ?? true;
  const showInStorefrontSection =
    ownShowInStorefrontSection ??
    resolveInheritedField(allCategories, inheritFromId, "showInStorefrontSection") ??
    true;
  const showInHeaderMenu =
    ownShowInHeaderMenu ??
    resolveInheritedField(allCategories, inheritFromId, "showInHeaderMenu") ??
    true;
  // Той самий принцип, що 3 перемикачі вище: null = не задано на цій
  // категорії, поле показує ефективне (успадковане) значення, доки людина
  // сама його не введе — тоді стає власним. Раніше тут був баг: ці 4 поля
  // мали "сирий" стан без резолву успадкування (лише перемикачі його мали),
  // тож дочірня категорія ніколи не бачила зміненої ваги/розмірів батька.
  const [ownDefaultWeightKg, setOwnDefaultWeightKg] = useState<string | null>(
    category?.defaultWeightKg ?? null
  );
  const [ownDefaultLengthCm, setOwnDefaultLengthCm] = useState<string | null>(
    category?.defaultLengthCm != null ? String(category.defaultLengthCm) : null
  );
  const [ownDefaultWidthCm, setOwnDefaultWidthCm] = useState<string | null>(
    category?.defaultWidthCm != null ? String(category.defaultWidthCm) : null
  );
  const [ownDefaultHeightCm, setOwnDefaultHeightCm] = useState<string | null>(
    category?.defaultHeightCm != null ? String(category.defaultHeightCm) : null
  );
  const inheritedDefaultWeightKg = resolveInheritedField(allCategories, inheritFromId, "defaultWeightKg");
  const inheritedDefaultLengthCm = resolveInheritedField(allCategories, inheritFromId, "defaultLengthCm");
  const inheritedDefaultWidthCm = resolveInheritedField(allCategories, inheritFromId, "defaultWidthCm");
  const inheritedDefaultHeightCm = resolveInheritedField(allCategories, inheritFromId, "defaultHeightCm");
  const defaultWeightKg = ownDefaultWeightKg ?? inheritedDefaultWeightKg ?? "";
  const defaultLengthCm =
    ownDefaultLengthCm ?? (inheritedDefaultLengthCm != null ? String(inheritedDefaultLengthCm) : "");
  const defaultWidthCm =
    ownDefaultWidthCm ?? (inheritedDefaultWidthCm != null ? String(inheritedDefaultWidthCm) : "");
  const defaultHeightCm =
    ownDefaultHeightCm ?? (inheritedDefaultHeightCm != null ? String(inheritedDefaultHeightCm) : "");
  // Попередження про каскад ваги/розмірів (за прямою вказівкою людини):
  // показується, лише коли людина реально торкнулась одного з 4 полів у цій
  // сесії форми (порівняння з початковим "власним" значенням категорії, не з
  // ефективним) — редагування товару так само каскадиться нижче (успадковують
  // товари категорії), але там повідомлення свідомо немає, лише тут.
  const packageFieldsDirty =
    ownDefaultWeightKg !== (category?.defaultWeightKg ?? null) ||
    ownDefaultLengthCm !== (category?.defaultLengthCm != null ? String(category.defaultLengthCm) : null) ||
    ownDefaultWidthCm !== (category?.defaultWidthCm != null ? String(category.defaultWidthCm) : null) ||
    ownDefaultHeightCm !== (category?.defaultHeightCm != null ? String(category.defaultHeightCm) : null);
  const hasChildCategories = category
    ? allCategories.some((c) => c.parentId === category.id)
    : false;
  const [seoH1, setSeoH1] = useState(category?.seoH1 ?? "");
  const [seoMetaTitle, setSeoMetaTitle] = useState(category?.seoMetaTitle ?? "");
  const [seoMetaDescription, setSeoMetaDescription] = useState(category?.seoMetaDescription ?? "");

  // Категорія не може стати батьком сама собі чи власному нащадку (дзеркалить
  // перевірку в actions.ts — тут лише щоб UI не пропонував недійсний вибір).
  const excludeIds = category
    ? new Set(
        allCategories
          .filter((c) => c.id === category.id || isDescendantCategory(allCategories, category.id, c.id))
          .map((c) => c.id)
      )
    : undefined;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);
    setError(null);

    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      try {
        const url = await uploadCategoryImageAction(fd);
        setImageUrl(url);
        setImagePreview(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося завантажити зображення");
        setImagePreview(category?.imageUrl ?? null);
      } finally {
        setIsUploadingImage(false);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (category) setSaveStatus("saving");

    const fd = new FormData();
    fd.set("name", name);
    fd.set("parentId", parentId);
    fd.set("description", description);
    fd.set("imageUrl", imageUrl);
    // Не власне значення (null) — поле свідомо НЕ додається у fd, щоб
    // parseCategoryInput/boolOrNull побачив його відсутність і лишив
    // успадкування від батьківської категорії, а не записав false.
    if (ownIsActive !== null) fd.set("isActive", String(ownIsActive));
    if (ownShowInStorefrontSection !== null)
      fd.set("showInStorefrontSection", String(ownShowInStorefrontSection));
    if (ownShowInHeaderMenu !== null) fd.set("showInHeaderMenu", String(ownShowInHeaderMenu));
    // own (не ефективне) — щоб непорушений inherited-хінт у полі не
    // "заморозився" у власне значення при простому збереженні форми;
    // own === null природно стає порожнім рядком → numberOrNull → null
    // (лишається успадкованим), як і для порожнього поля взагалі.
    fd.set("defaultWeightKg", ownDefaultWeightKg ?? "");
    fd.set("defaultLengthCm", ownDefaultLengthCm ?? "");
    fd.set("defaultWidthCm", ownDefaultWidthCm ?? "");
    fd.set("defaultHeightCm", ownDefaultHeightCm ?? "");
    fd.set("seoH1", seoH1);
    fd.set("seoMetaTitle", seoMetaTitle);
    fd.set("seoMetaDescription", seoMetaDescription);

    startTransition(async () => {
      try {
        if (category) {
          await updateCategoryAction(category.id, fd);
          setSaveStatus("saved");
          router.refresh();
        } else {
          const created = await createCategoryAction(fd);
          router.push(`/settings/categories/${created.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти категорію");
        if (category) setSaveStatus("error");
      }
    });
  }

  // Автозбереження "Основне" (лише редагування наявної категорії) — короткий
  // debounce після останньої зміни будь-якого поля, той самий principle, що
  // ProductEditorContext (conventions.md). Пропускає перший рендер (початкові
  // значення з category, не "зміна").
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!category) return;
    const timeout = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- саме ці поля утворюють payload handleSubmit, category/formRef стабільні
  }, [
    name,
    parentId,
    description,
    imageUrl,
    ownIsActive,
    ownShowInStorefrontSection,
    ownShowInHeaderMenu,
    ownDefaultWeightKg,
    ownDefaultLengthCm,
    ownDefaultWidthCm,
    ownDefaultHeightCm,
    seoH1,
    seoMetaTitle,
    seoMetaDescription,
  ]);

  const generalForm = (
      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <Card className="gap-0 py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            <h2 className="text-sm font-semibold text-foreground">Основне</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground" htmlFor="category-name">
                Назва
              </label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Назва категорії"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Батьківська категорія</label>
              <CategoryTreeSelect
                categories={allCategories}
                value={parentId}
                onChange={setParentId}
                triggerClassName="w-full"
                excludeIds={excludeIds}
                noneOption={{ value: "root", label: "— Коренева —" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground" htmlFor="category-description">
                Опис
              </label>
              <Textarea
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опис категорії..."
                className="min-h-32"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            <h2 className="text-sm font-semibold text-foreground">SEO</h2>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground" htmlFor="category-seo-h1">
                  H1 на сторінці
                </label>
                <span className="text-xs text-muted-foreground">{seoH1.length} / 120</span>
              </div>
              <Input
                id="category-seo-h1"
                value={seoH1}
                onChange={(e) => setSeoH1(e.target.value.slice(0, 120))}
                placeholder="за шаблоном магазину"
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground" htmlFor="category-seo-title">
                  Meta title
                </label>
                <span className="text-xs text-muted-foreground">{seoMetaTitle.length} / 191</span>
              </div>
              <Input
                id="category-seo-title"
                value={seoMetaTitle}
                onChange={(e) => setSeoMetaTitle(e.target.value.slice(0, 191))}
                placeholder="за шаблоном магазину"
                maxLength={191}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground" htmlFor="category-seo-description">
                  Meta description
                </label>
                <span className="text-xs text-muted-foreground">
                  {seoMetaDescription.length} / 250
                </span>
              </div>
              <Textarea
                id="category-seo-description"
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value.slice(0, 250))}
                placeholder="необов'язково"
                maxLength={250}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="gap-0 py-4">
          <CardContent className="flex flex-col gap-4 px-4">
            <h2 className="text-sm font-semibold text-foreground">
              {category ? category.name : "Нова категорія"}
            </h2>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Зображення</span>
              <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {imagePreview ? (
                    // категорійні зображення поки без next/image (довільні blob/локальні URL)
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {isUploadingImage ? "Завантаження..." : "Завантажити"}
                  </Button>
                  <span className="text-xs text-muted-foreground">до 5 МБ</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">Активна на вітрині</span>
              <Switch checked={isActive} onCheckedChange={setOwnIsActive} />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">Показувати в «Розділі магазину»</span>
              <Switch
                checked={showInStorefrontSection}
                onCheckedChange={setOwnShowInStorefrontSection}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">Показувати в меню шапки</span>
              <Switch checked={showInHeaderMenu} onCheckedChange={setOwnShowInHeaderMenu} />
            </div>

            <p className="text-xs text-muted-foreground">
              У запакованому вигляді — для Нової Пошти/Укрпошти. Підставляється в товари категорії,
              якщо там не вказано своє.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground" htmlFor="category-weight">
                Вага за замовчуванням, кг
              </label>
              <Input
                id="category-weight"
                type="number"
                min={0}
                step={0.01}
                value={defaultWeightKg}
                onChange={(e) => setOwnDefaultWeightKg(e.target.value)}
                placeholder="для товарів"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="category-length">
                  Довжина, см
                </label>
                <Input
                  id="category-length"
                  type="number"
                  min={0}
                  value={defaultLengthCm}
                  onChange={(e) => setOwnDefaultLengthCm(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="category-width">
                  Ширина, см
                </label>
                <Input
                  id="category-width"
                  type="number"
                  min={0}
                  value={defaultWidthCm}
                  onChange={(e) => setOwnDefaultWidthCm(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground" htmlFor="category-height">
                  Висота, см
                </label>
                <Input
                  id="category-height"
                  type="number"
                  min={0}
                  value={defaultHeightCm}
                  onChange={(e) => setOwnDefaultHeightCm(e.target.value)}
                />
              </div>
            </div>

            {category && packageFieldsDirty && (
              <p className="text-xs text-primary">
                {hasChildCategories
                  ? "Це значення успадкують товари цієї категорії та всі підкатегорії (і їхні товари), які не мають власного значення."
                  : "Це значення успадкують усі товари цієї категорії, які не мають власного значення."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      </form>
  );

  // Обидві вкладки наявної категорії — автозбереження, без кнопки в хедері
  // (conventions.md, 2026-08-02: спершу лишали "Характеристики" з кнопкою й
  // попередженням про каскад через ризик, але людина прямо попросила прибрати
  // й це — усвідомлюючи, що каскад на дочірні категорії тепер теж спрацьовує
  // без підтвердження, decisions.md). Статус автозбереження "Основне" — тут,
  // у хедері; статус "Характеристики" — власний індикатор усередині пікера
  // (там своя автономна автозбереження на кожну дію drag&drop, не через цю
  // форму). На /new — єдиний виняток, явна кнопка "Створити категорію".
  const isGeneralTab = activeTab === "general";
  const primaryAction = category
    ? undefined
    : { label: "Створити категорію", onClick: () => formRef.current?.requestSubmit(), disabled: isPending };
  const secondaryAction = {
    label: category ? "До списку" : "Скасувати",
    onClick: () => router.push("/settings?tab=categories"),
  };
  const statusMessage =
    category && isGeneralTab
      ? { idle: null, saving: "Збереження…", saved: "Збережено", error: null }[saveStatus]
      : null;
  const errorMessage = category && isGeneralTab && saveStatus === "error" ? error : !category ? error : null;

  return (
    <div className="flex flex-1 flex-col">
      <CategoryFormHeader
        category={category}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        statusMessage={statusMessage}
        errorMessage={errorMessage}
      />

      {category && characteristics ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "general" | "characteristics")}
          className="flex flex-1 flex-col gap-0"
        >
          <div className="border-b border-border px-6 pt-3">
            <TabsList variant="line">
              <TabsTrigger value="general">Основне</TabsTrigger>
              <TabsTrigger value="characteristics">Характеристики</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="general">{generalForm}</TabsContent>
          <TabsContent value="characteristics" className="p-6">
            <CategoryCharacteristicsPicker
              categoryId={category.id}
              options={characteristics.options}
              initialPinnedKeys={characteristics.pinnedKeys}
              hasChildCategories={hasChildCategories}
            />
          </TabsContent>
        </Tabs>
      ) : (
        generalForm
      )}
    </div>
  );
}
