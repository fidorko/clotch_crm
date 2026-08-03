import { and, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { mockProduct } from "@/lib/mocks/products";
import { mockColors } from "@/lib/mocks/colors";
import { mockBrands } from "@/lib/mocks/brands";
import { mockCurrencies } from "@/lib/mocks/currencies";
import { mockMaterials } from "@/lib/mocks/materials";
import { mockCountries } from "@/lib/mocks/countries";
import { mockSizeTypes } from "@/lib/mocks/size-types";
import { mockMeasurementTypes } from "@/lib/mocks/measurement-types";
import { mockFabricTypes } from "@/lib/mocks/fabric-types";
import * as schema from "./schema";

// Мок мав лише посилання-заглушку (placehold.co) — тепер фото зберігається
// байтами в БД, тож для сіду потрібен реальний, хай і мінімальний, PNG.
const PLACEHOLDER_PHOTO_DATA = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);
const PLACEHOLDER_PHOTO_MIME_TYPE = "image/png";

/**
 * Dev-сід: підключається як власник схеми (DATABASE_URL, обходить RLS), бо
 * заповнення довідникових даних — адміністративна дія, а не тенант-скоупований
 * запит застосунку. tenants.id навмисно збігається з DEV_TENANT_ID з .env,
 * щоб getDevTenantId() одразу знаходив дані.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const devTenantId = process.env.DEV_TENANT_ID;
  if (!databaseUrl) throw new Error("DATABASE_URL не задано — див. docs/env.md");
  if (!devTenantId) throw new Error("DEV_TENANT_ID не задано — див. docs/env.md");

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  await db
    .insert(schema.tenants)
    .values({ id: devTenantId, name: "Dev Tenant" })
    .onConflictDoNothing();

  const [product] = await db
    .insert(schema.products)
    .values({
      tenantId: devTenantId,
      name: mockProduct.name,
      category: mockProduct.category,
      categoryPath: mockProduct.categoryPath,
      status: mockProduct.status,
      modelCode: mockProduct.modelCode,
      season: mockProduct.season,
      gender: mockProduct.info.gender,
      description: mockProduct.info.description,
      purchasePrice: String(mockProduct.pricing.purchasePrice),
      oldPrice: String(mockProduct.pricing.oldPrice),
      retailMode: mockProduct.pricing.retail.mode,
      retailAmount: String(mockProduct.pricing.retail.amount),
      retailPercent: String(mockProduct.pricing.retail.percent),
      wholesaleMode: mockProduct.pricing.wholesale.mode,
      wholesaleAmount: String(mockProduct.pricing.wholesale.amount),
      wholesalePercent: String(mockProduct.pricing.wholesale.percent),
      dropshipMode: mockProduct.pricing.dropship.mode,
      dropshipAmount: String(mockProduct.pricing.dropship.amount),
      dropshipPercent: String(mockProduct.pricing.dropship.percent),
      retailDiscountMode: mockProduct.pricing.retailDiscount.mode,
      retailDiscountAmount: String(mockProduct.pricing.retailDiscount.amount),
      retailDiscountPercent: String(mockProduct.pricing.retailDiscount.percent),
      internalCode: mockProduct.meta.internalCode,
      supplierCode: mockProduct.meta.supplierCode,
      packageLengthCm: mockProduct.meta.packageLengthCm,
      packageWidthCm: mockProduct.meta.packageWidthCm,
      packageHeightCm: mockProduct.meta.packageHeightCm,
      packageWeightKg: String(mockProduct.meta.packageWeightKg),
      createdBy: mockProduct.meta.createdBy,
      updatedBy: mockProduct.meta.updatedBy,
    })
    .onConflictDoNothing()
    .returning();

  if (product) {
    if (mockProduct.skus.length > 0) {
      // Мок використовує той самий плейсхолдер-штрихкод "482001..." для всіх SKU —
      // це порушує UNIQUE(tenant_id, barcode), тож для сіду генеруємо унікальний per-SKU.
      await db.insert(schema.productSkus).values(
        mockProduct.skus.map((sku, index) => ({
          tenantId: devTenantId,
          productId: product.id,
          code: sku.code,
          color: sku.color,
          colorHex: sku.colorHex,
          size: sku.size,
          barcode: `4820${String(index).padStart(9, "0")}`,
          stock: sku.stock,
          cell: sku.cell || null,
        }))
      );
    }

    if (mockProduct.photos.length > 0) {
      await db.insert(schema.productPhotos).values(
        mockProduct.photos.map((photo, index) => ({
          tenantId: devTenantId,
          productId: product.id,
          data: PLACEHOLDER_PHOTO_DATA,
          mimeType: PLACEHOLDER_PHOTO_MIME_TYPE,
          alt: photo.alt,
          position: index,
        }))
      );
    }

    if (mockProduct.tags.length > 0) {
      // Теги — рядок custom_characteristics (system_key="tags"), не окрема таблиця
      // (db.md, decisions.md) — той самий find-or-create, що syncProductTags.
      let [tagsCharacteristic] = await db
        .select({ id: schema.customCharacteristics.id })
        .from(schema.customCharacteristics)
        .where(
          and(
            eq(schema.customCharacteristics.tenantId, devTenantId),
            eq(schema.customCharacteristics.systemKey, "tags")
          )
        );
      if (!tagsCharacteristic) {
        [tagsCharacteristic] = await db
          .insert(schema.customCharacteristics)
          .values({ tenantId: devTenantId, name: "Теги", systemKey: "tags" })
          .returning({ id: schema.customCharacteristics.id });
      }

      for (const tag of mockProduct.tags) {
        const [existingValue] = await db
          .select({ id: schema.customCharacteristicValues.id })
          .from(schema.customCharacteristicValues)
          .where(
            and(
              eq(schema.customCharacteristicValues.tenantId, devTenantId),
              eq(schema.customCharacteristicValues.characteristicId, tagsCharacteristic.id),
              eq(schema.customCharacteristicValues.value, tag.label)
            )
          );
        const [valueRow] = existingValue
          ? [existingValue]
          : await db
              .insert(schema.customCharacteristicValues)
              .values({ tenantId: devTenantId, characteristicId: tagsCharacteristic.id, value: tag.label })
              .returning({ id: schema.customCharacteristicValues.id });
        await db
          .insert(schema.productTags)
          .values({ productId: product.id, characteristicValueId: valueRow.id, tenantId: devTenantId })
          .onConflictDoNothing();
      }
    }
  }

  if (mockColors.length > 0) {
    await db
      .insert(schema.colors)
      .values(
        mockColors.map((color, index) => ({
          tenantId: devTenantId,
          name: color.name,
          hex: color.hex,
          position: index,
        }))
      )
      .onConflictDoNothing();
  }

  if (mockBrands.length > 0) {
    // Бренди — рядок custom_characteristics (не reference_items) — за прямою
    // вказівкою перенесено разом із Колекціями/Сезоном/Тегами/Посадкою (db.md).
    const [brandsCharacteristic] = await db
      .insert(schema.customCharacteristics)
      .values({ tenantId: devTenantId, name: "Бренди" })
      .onConflictDoNothing()
      .returning({ id: schema.customCharacteristics.id });
    const brandsCharacteristicId =
      brandsCharacteristic?.id ??
      (
        await db
          .select({ id: schema.customCharacteristics.id })
          .from(schema.customCharacteristics)
          .where(
            and(
              eq(schema.customCharacteristics.tenantId, devTenantId),
              eq(schema.customCharacteristics.name, "Бренди")
            )
          )
      )[0].id;

    await db
      .insert(schema.customCharacteristicValues)
      .values(
        mockBrands.map((value, index) => ({
          tenantId: devTenantId,
          characteristicId: brandsCharacteristicId,
          value,
          position: index,
        }))
      )
      .onConflictDoNothing();
  }

  if (mockCurrencies.length > 0) {
    await db
      .insert(schema.currencies)
      .values(
        mockCurrencies.map((currency, index) => ({
          tenantId: devTenantId,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          symbolPosition: currency.symbolPosition,
          decimalPlaces: currency.decimalPlaces,
          isActive: currency.isActive,
          isDefault: currency.isDefault,
          autoUpdate: currency.autoUpdate,
          position: index,
        }))
      )
      .onConflictDoNothing();
  }

  if (mockCountries.length > 0) {
    // "Країна бренду"/"Країна виготовлення" (products-characteristics.md) —
    // два окремих поля товару, обидва з цього самого довідника reference_items
    // (kind="countries"). onConflictDoNothing — рядки, створені людиною вручну
    // під час тестування (напр. "Турція"), лишаються як є, без дублю.
    await db
      .insert(schema.referenceItems)
      .values(
        mockCountries.map((name, index) => ({
          tenantId: devTenantId,
          kind: "countries" as const,
          name,
          position: index,
        }))
      )
      .onConflictDoNothing();
  }

  if (mockMaterials.length > 0) {
    // onConflictDoUpdate (лише category), не onConflictDoNothing — щоб материал,
    // уже створений людиною вручну з тим самим ім'ям (напр. під час тестування
    // UI), отримав категорію заднім числом, а не лишився назавжди без неї;
    // color/position наявного рядка навмисно не чіпаємо.
    for (const [index, material] of mockMaterials.entries()) {
      await db
        .insert(schema.materials)
        .values({ tenantId: devTenantId, name: material.name, category: material.category, position: index })
        .onConflictDoUpdate({
          target: [schema.materials.tenantId, schema.materials.name],
          set: { category: material.category },
        });
    }
  }

  // "Розміри"/"Заміри" — той самий "тип -> значення" сід-патерн, що бренди
  // (custom_characteristics): insert типу з onConflictDoNothing, за потреби
  // select наявного id, тоді insert значень з onConflictDoNothing.
  for (const [typeIndex, sizeType] of mockSizeTypes.entries()) {
    const [inserted] = await db
      .insert(schema.sizeTypes)
      .values({ tenantId: devTenantId, name: sizeType.name, position: typeIndex })
      .onConflictDoNothing()
      .returning({ id: schema.sizeTypes.id });
    const typeId =
      inserted?.id ??
      (
        await db
          .select({ id: schema.sizeTypes.id })
          .from(schema.sizeTypes)
          .where(and(eq(schema.sizeTypes.tenantId, devTenantId), eq(schema.sizeTypes.name, sizeType.name)))
      )[0].id;

    if (sizeType.values.length > 0) {
      await db
        .insert(schema.sizeValues)
        .values(
          sizeType.values.map((value, index) => ({
            tenantId: devTenantId,
            sizeTypeId: typeId,
            value,
            position: index,
          }))
        )
        .onConflictDoNothing();
    }
  }

  for (const [typeIndex, measurementType] of mockMeasurementTypes.entries()) {
    const [inserted] = await db
      .insert(schema.measurementTypes)
      .values({ tenantId: devTenantId, name: measurementType.name, position: typeIndex })
      .onConflictDoNothing()
      .returning({ id: schema.measurementTypes.id });
    const typeId =
      inserted?.id ??
      (
        await db
          .select({ id: schema.measurementTypes.id })
          .from(schema.measurementTypes)
          .where(
            and(eq(schema.measurementTypes.tenantId, devTenantId), eq(schema.measurementTypes.name, measurementType.name))
          )
      )[0].id;

    if (measurementType.values.length > 0) {
      await db
        .insert(schema.measurementValues)
        .values(
          measurementType.values.map((value, index) => ({
            tenantId: devTenantId,
            measurementTypeId: typeId,
            value,
            position: index,
          }))
        )
        .onConflictDoNothing();
    }
  }

  // "Тип тканини" — той самий сід-патерн, що розміри/заміри (insert типу з
  // onConflictDoNothing, за потреби select наявного id), плюс "Можливі
  // матеріали" — junction-таблиця, id матеріалів шукаємо по вже засіяній назві
  // (mockMaterials вище). "code" (унікальний slug) генеруємо тут же — той
  // самий транслітератор, що server/data/fabric-types.ts (не експортований
  // звідти, тому невеликий дубль; тут це прийнятно — сід одноразово ставить
  // фіксовані назви, а не довільний людський ввід із ретраєм при колізії).
  const FABRIC_TRANSLIT_MAP: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
  };
  function slugifyFabricType(name: string): string {
    const transliterated = name
      .toLowerCase()
      .split("")
      .map((ch) => FABRIC_TRANSLIT_MAP[ch] ?? ch)
      .join("");
    return transliterated.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tip-tkanyny";
  }

  if (mockFabricTypes.length > 0) {
    const materialIdByName = new Map(
      (
        await db
          .select({ id: schema.materials.id, name: schema.materials.name })
          .from(schema.materials)
          .where(eq(schema.materials.tenantId, devTenantId))
      ).map((m) => [m.name, m.id])
    );

    for (const [index, fabricType] of mockFabricTypes.entries()) {
      const [inserted] = await db
        .insert(schema.fabricTypes)
        .values({
          tenantId: devTenantId,
          name: fabricType.name,
          code: slugifyFabricType(fabricType.name),
          description: fabricType.description,
          density: fabricType.density,
          stretch: fabricType.stretch,
          frontSide: fabricType.frontSide,
          backSide: fabricType.backSide,
          tactileFeel: fabricType.tactileFeel,
          position: index,
        })
        .onConflictDoNothing({ target: [schema.fabricTypes.tenantId, schema.fabricTypes.name] })
        .returning({ id: schema.fabricTypes.id });
      const fabricTypeId =
        inserted?.id ??
        (
          await db
            .select({ id: schema.fabricTypes.id })
            .from(schema.fabricTypes)
            .where(and(eq(schema.fabricTypes.tenantId, devTenantId), eq(schema.fabricTypes.name, fabricType.name)))
        )[0].id;

      const possibleMaterialIds = fabricType.possibleMaterials
        .map((name) => materialIdByName.get(name))
        .filter((id): id is string => id !== undefined);
      if (possibleMaterialIds.length > 0) {
        await db
          .insert(schema.fabricTypePossibleMaterials)
          .values(
            possibleMaterialIds.map((materialId) => ({ tenantId: devTenantId, fabricTypeId, materialId }))
          )
          .onConflictDoNothing();
      }
    }
  }

  console.log("Seed завершено. /products/" + (product?.id ?? "(вже існував)"), "тенант:", devTenantId);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
