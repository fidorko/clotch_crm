import { and, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { mockProduct } from "@/lib/mocks/products";
import { mockCategories } from "@/lib/mocks/categories";
import * as schema from "./schema";

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
      brand: mockProduct.brand,
      collection: mockProduct.collection,
      season: mockProduct.season,
      gender: mockProduct.info.gender,
      seasonType: mockProduct.info.seasonType,
      fit: mockProduct.info.fit,
      countryOfOrigin: mockProduct.info.countryOfOrigin,
      manufacturer: mockProduct.info.manufacturer,
      material: mockProduct.info.material,
      fabricType: mockProduct.info.fabricType,
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
      supplier: mockProduct.meta.supplier,
      brandCountry: mockProduct.meta.brandCountry,
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
          url: photo.url || "https://placehold.co/800x800",
          alt: photo.alt,
          position: index,
        }))
      );
    }

    if (mockProduct.measurements.length > 0) {
      await db.insert(schema.productMeasurements).values(
        mockProduct.measurements.map((m) => ({
          tenantId: devTenantId,
          productId: product.id,
          type: m.type,
          valueCm: String(m.valueCm),
        }))
      );
    }

    for (const tag of mockProduct.tags) {
      const [existingTag] = await db
        .select({ id: schema.tags.id })
        .from(schema.tags)
        .where(and(eq(schema.tags.tenantId, devTenantId), eq(schema.tags.label, tag.label)));
      const [tagRow] = existingTag
        ? [existingTag]
        : await db
            .insert(schema.tags)
            .values({ tenantId: devTenantId, label: tag.label })
            .returning({ id: schema.tags.id });
      const tagId = tagRow.id;
      await db
        .insert(schema.productTags)
        .values({ productId: product.id, tagId, tenantId: devTenantId })
        .onConflictDoNothing();
    }
  }

  // Категорії: мок має ієрархію через власні (не-UUID) id — вставляємо
  // "згори вниз" (батьки перед дітьми), мапуючи мок-id -> реальний uuid.
  if (mockCategories.length > 0) {
    const idMap = new Map<string, string>();
    const remaining = [...mockCategories];
    while (remaining.length > 0) {
      const insertable = remaining.filter(
        (c) => c.parentId === null || idMap.has(c.parentId)
      );
      if (insertable.length === 0) break;

      for (const mockCategory of insertable) {
        const [existing] = await db
          .select({ id: schema.categories.id })
          .from(schema.categories)
          .where(
            and(
              eq(schema.categories.tenantId, devTenantId),
              eq(schema.categories.name, mockCategory.name)
            )
          );
        const realId = existing
          ? existing.id
          : (
              await db
                .insert(schema.categories)
                .values({
                  tenantId: devTenantId,
                  parentId: mockCategory.parentId ? (idMap.get(mockCategory.parentId) ?? null) : null,
                  name: mockCategory.name,
                  isActive: mockCategory.isActive,
                })
                .returning({ id: schema.categories.id })
            )[0].id;
        idMap.set(mockCategory.id, realId);
      }

      for (const c of insertable) {
        remaining.splice(remaining.indexOf(c), 1);
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
