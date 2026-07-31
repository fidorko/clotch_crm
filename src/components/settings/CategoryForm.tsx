"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageIcon, Save, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [defaultWeightKg, setDefaultWeightKg] = useState(category?.defaultWeightKg ?? "");
  const [defaultLengthCm, setDefaultLengthCm] = useState(
    category?.defaultLengthCm != null ? String(category.defaultLengthCm) : ""
  );
  const [defaultWidthCm, setDefaultWidthCm] = useState(
    category?.defaultWidthCm != null ? String(category.defaultWidthCm) : ""
  );
  const [defaultHeightCm, setDefaultHeightCm] = useState(
    category?.defaultHeightCm != null ? String(category.defaultHeightCm) : ""
  );
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
    fd.set("defaultWeightKg", defaultWeightKg);
    fd.set("defaultLengthCm", defaultLengthCm);
    fd.set("defaultWidthCm", defaultWidthCm);
    fd.set("defaultHeightCm", defaultHeightCm);
    fd.set("seoH1", seoH1);
    fd.set("seoMetaTitle", seoMetaTitle);
    fd.set("seoMetaDescription", seoMetaDescription);

    startTransition(async () => {
      try {
        if (category) {
          await updateCategoryAction(category.id, fd);
          router.refresh();
        } else {
          const created = await createCategoryAction(fd);
          router.push(`/settings/categories/${created.id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не вдалося зберегти категорію");
      }
    });
  }

  const generalForm = (
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
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
                onChange={(e) => setDefaultWeightKg(e.target.value)}
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
                  onChange={(e) => setDefaultLengthCm(e.target.value)}
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
                  onChange={(e) => setDefaultWidthCm(e.target.value)}
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
                  onChange={(e) => setDefaultHeightCm(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isPending}>
              <Save className="size-4" />
              {category ? "Зберегти" : "Створити категорію"}
            </Button>
            <Link href="/settings?tab=categories" className={buttonVariants({ variant: "outline" })}>
              Скасувати
            </Link>
          </CardContent>
        </Card>
      </div>
      </form>
  );

  return (
    <div className="flex flex-1 flex-col">
      <CategoryFormHeader category={category} />

      {category && characteristics ? (
        <Tabs defaultValue="general" className="flex flex-1 flex-col gap-0">
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
            />
          </TabsContent>
        </Tabs>
      ) : (
        generalForm
      )}
    </div>
  );
}
