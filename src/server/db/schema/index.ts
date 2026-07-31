import { relations } from "drizzle-orm";
import { products } from "./products";
import { productSkus } from "./product-skus";
import { productPhotos } from "./product-photos";
import { productColorPhotos } from "./product-color-photos";
import { productMeasurements } from "./product-measurements";
import { productTags } from "./product-tags";
import { tenants } from "./tenants";
import { categories } from "./categories";
import { colors } from "./colors";
import { currencies } from "./currencies";
import { customCharacteristics, customCharacteristicValues } from "./custom-characteristics";
import { suppliers } from "./suppliers";
import { supplierContacts } from "./supplier-contacts";
import { supplierChannels } from "./supplier-channels";
import { supplierCustomFields } from "./supplier-custom-fields";
import { referenceItems } from "./reference-items";
import { referenceDictionaryFlags } from "./reference-dictionary-flags";
import { materials } from "./materials";
import { careInstructions } from "./care-instructions";
import {
  fabricTypeCareInstructions,
  fabricTypeComposition,
  fabricTypePossibleMaterials,
  fabricTypeSeasons,
  fabricTypes,
} from "./fabric-types";

export * from "./tenants";
export * from "./products";
export * from "./product-skus";
export * from "./product-photos";
export * from "./product-color-photos";
export * from "./product-measurements";
export * from "./product-tags";
export * from "./categories";
export * from "./colors";
export * from "./currencies";
export * from "./custom-characteristics";
export * from "./suppliers";
export * from "./supplier-contacts";
export * from "./supplier-channels";
export * from "./supplier-custom-fields";
export * from "./reference-items";
export * from "./reference-dictionary-flags";
export * from "./materials";
export * from "./care-instructions";
export * from "./fabric-types";

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

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, { fields: [productTags.productId], references: [products.id] }),
  characteristicValue: one(customCharacteristicValues, {
    fields: [productTags.characteristicValueId],
    references: [customCharacteristicValues.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  products: many(products),
  categories: many(categories),
  colors: many(colors),
  currencies: many(currencies),
  suppliers: many(suppliers),
  referenceItems: many(referenceItems),
  customCharacteristics: many(customCharacteristics),
  referenceDictionaryFlags: many(referenceDictionaryFlags),
  materials: many(materials),
  careInstructions: many(careInstructions),
  fabricTypes: many(fabricTypes),
}));

export const fabricTypesRelations = relations(fabricTypes, ({ many }) => ({
  composition: many(fabricTypeComposition),
  possibleMaterials: many(fabricTypePossibleMaterials),
  seasons: many(fabricTypeSeasons),
  careInstructions: many(fabricTypeCareInstructions),
}));

export const fabricTypeCompositionRelations = relations(fabricTypeComposition, ({ one }) => ({
  fabricType: one(fabricTypes, { fields: [fabricTypeComposition.fabricTypeId], references: [fabricTypes.id] }),
  material: one(materials, { fields: [fabricTypeComposition.materialId], references: [materials.id] }),
}));

export const fabricTypePossibleMaterialsRelations = relations(fabricTypePossibleMaterials, ({ one }) => ({
  fabricType: one(fabricTypes, { fields: [fabricTypePossibleMaterials.fabricTypeId], references: [fabricTypes.id] }),
  material: one(materials, { fields: [fabricTypePossibleMaterials.materialId], references: [materials.id] }),
}));

export const fabricTypeCareInstructionsRelations = relations(fabricTypeCareInstructions, ({ one }) => ({
  fabricType: one(fabricTypes, { fields: [fabricTypeCareInstructions.fabricTypeId], references: [fabricTypes.id] }),
  careInstruction: one(careInstructions, {
    fields: [fabricTypeCareInstructions.careInstructionId],
    references: [careInstructions.id],
  }),
}));

export const customCharacteristicsRelations = relations(customCharacteristics, ({ many }) => ({
  values: many(customCharacteristicValues),
}));

export const customCharacteristicValuesRelations = relations(customCharacteristicValues, ({ one, many }) => ({
  characteristic: one(customCharacteristics, {
    fields: [customCharacteristicValues.characteristicId],
    references: [customCharacteristics.id],
  }),
  productTags: many(productTags),
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
