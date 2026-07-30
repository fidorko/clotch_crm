import { relations } from "drizzle-orm";
import { products } from "./products";
import { productSkus } from "./product-skus";
import { productPhotos } from "./product-photos";
import { productMeasurements } from "./product-measurements";
import { productTags, tags } from "./tags";
import { tenants } from "./tenants";
import { categories } from "./categories";

export * from "./tenants";
export * from "./products";
export * from "./product-skus";
export * from "./product-photos";
export * from "./product-measurements";
export * from "./tags";
export * from "./categories";

export const productsRelations = relations(products, ({ many }) => ({
  skus: many(productSkus),
  photos: many(productPhotos),
  measurements: many(productMeasurements),
  productTags: many(productTags),
}));

export const productSkusRelations = relations(productSkus, ({ one }) => ({
  product: one(products, { fields: [productSkus.productId], references: [products.id] }),
}));

export const productPhotosRelations = relations(productPhotos, ({ one }) => ({
  product: one(products, { fields: [productPhotos.productId], references: [products.id] }),
}));

export const productMeasurementsRelations = relations(productMeasurements, ({ one }) => ({
  product: one(products, { fields: [productMeasurements.productId], references: [products.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, { fields: [productTags.productId], references: [products.id] }),
  tag: one(tags, { fields: [productTags.tagId], references: [tags.id] }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  products: many(products),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));
