import { relations } from "drizzle-orm";
import { products } from "./products";
import { productSkus } from "./product-skus";
import { productPhotos } from "./product-photos";
import { productColorPhotos } from "./product-color-photos";
import { productMeasurements } from "./product-measurements";
import { productTags, tags } from "./tags";
import { tenants } from "./tenants";
import { categories } from "./categories";
import { colors } from "./colors";
import { suppliers } from "./suppliers";
import { supplierContacts } from "./supplier-contacts";
import { supplierChannels } from "./supplier-channels";
import { supplierCustomFields } from "./supplier-custom-fields";

export * from "./tenants";
export * from "./products";
export * from "./product-skus";
export * from "./product-photos";
export * from "./product-color-photos";
export * from "./product-measurements";
export * from "./tags";
export * from "./categories";
export * from "./colors";
export * from "./suppliers";
export * from "./supplier-contacts";
export * from "./supplier-channels";
export * from "./supplier-custom-fields";

export const productsRelations = relations(products, ({ many }) => ({
  skus: many(productSkus),
  photos: many(productPhotos),
  colorPhotos: many(productColorPhotos),
  measurements: many(productMeasurements),
  productTags: many(productTags),
}));

export const productSkusRelations = relations(productSkus, ({ one }) => ({
  product: one(products, { fields: [productSkus.productId], references: [products.id] }),
}));

export const productColorPhotosRelations = relations(productColorPhotos, ({ one }) => ({
  product: one(products, { fields: [productColorPhotos.productId], references: [products.id] }),
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
  colors: many(colors),
  suppliers: many(suppliers),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  contacts: many(supplierContacts),
  channels: many(supplierChannels),
  customFields: many(supplierCustomFields),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierContacts.supplierId], references: [suppliers.id] }),
}));

export const supplierChannelsRelations = relations(supplierChannels, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierChannels.supplierId], references: [suppliers.id] }),
}));

export const supplierCustomFieldsRelations = relations(supplierCustomFields, ({ one }) => ({
  supplier: one(suppliers, { fields: [supplierCustomFields.supplierId], references: [suppliers.id] }),
}));
