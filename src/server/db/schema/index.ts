import { relations } from "drizzle-orm";
import { products } from "./products";
import { productSkus } from "./product-skus";
import { productColorPhotos } from "./product-color-photos";
import { productSizeMeasurements } from "./product-size-measurements";
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
import { fabricTypePossibleMaterials, fabricTypes } from "./fabric-types";
import { sizeTypes, sizeValues } from "./size-types";
import { measurementTypes, measurementValues } from "./measurement-types";
import { categoryCharacteristics } from "./category-characteristics";
import { productCharacteristicValues } from "./product-characteristic-values";
import { productMaterialComposition } from "./product-material-composition";
import { productActivityLog } from "./product-activity-log";
import { warehouses } from "./warehouses";
import { warehouseBinStreets, warehouseBinRacks, warehouseBinCells } from "./warehouse-bin-locations";
import { receivingDocuments, receivingDocumentCustomFields } from "./receiving";

export * from "./tenants";
export * from "./warehouses";
export * from "./warehouse-bin-locations";
export * from "./receiving";
export * from "./category-images";
export * from "./products";
export * from "./product-skus";
export * from "./product-color-photos";
export * from "./product-size-measurements";
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
export * from "./size-types";
export * from "./measurement-types";
export * from "./category-characteristics";
export * from "./product-characteristic-values";
export * from "./product-material-composition";
export * from "./product-characteristic-layout";
export * from "./product-technical-layout";
export * from "./product-activity-log";

export const productsRelations = relations(products, ({ many }) => ({
  skus: many(productSkus),
  // Фото товару — тільки за кольором (product_color_photos); окремої таблиці
  // "фото моделі" більше немає (db.md, 2026-08-03).
  colorPhotos: many(productColorPhotos),
  sizeMeasurements: many(productSizeMeasurements),
  productTags: many(productTags),
  characteristicValues: many(productCharacteristicValues),
  materialComposition: many(productMaterialComposition),
  activityLog: many(productActivityLog),
}));

export const productActivityLogRelations = relations(productActivityLog, ({ one }) => ({
  product: one(products, { fields: [productActivityLog.productId], references: [products.id] }),
}));

export const productCharacteristicValuesRelations = relations(productCharacteristicValues, ({ one }) => ({
  product: one(products, { fields: [productCharacteristicValues.productId], references: [products.id] }),
}));

export const productMaterialCompositionRelations = relations(productMaterialComposition, ({ one }) => ({
  product: one(products, { fields: [productMaterialComposition.productId], references: [products.id] }),
  material: one(materials, { fields: [productMaterialComposition.materialId], references: [materials.id] }),
}));

export const productSkusRelations = relations(productSkus, ({ one }) => ({
  product: one(products, { fields: [productSkus.productId], references: [products.id] }),
}));

export const productColorPhotosRelations = relations(productColorPhotos, ({ one }) => ({
  product: one(products, { fields: [productColorPhotos.productId], references: [products.id] }),
}));

export const productSizeMeasurementsRelations = relations(productSizeMeasurements, ({ one }) => ({
  product: one(products, { fields: [productSizeMeasurements.productId], references: [products.id] }),
  measurementValue: one(measurementValues, {
    fields: [productSizeMeasurements.measurementValueId],
    references: [measurementValues.id],
  }),
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
  sizeTypes: many(sizeTypes),
  measurementTypes: many(measurementTypes),
  warehouses: many(warehouses),
  receivingDocuments: many(receivingDocuments),
}));

export const receivingDocumentsRelations = relations(receivingDocuments, ({ many }) => ({
  customFields: many(receivingDocumentCustomFields),
}));

export const receivingDocumentCustomFieldsRelations = relations(receivingDocumentCustomFields, ({ one }) => ({
  document: one(receivingDocuments, {
    fields: [receivingDocumentCustomFields.documentId],
    references: [receivingDocuments.id],
  }),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  binStreets: many(warehouseBinStreets),
}));

export const warehouseBinStreetsRelations = relations(warehouseBinStreets, ({ one, many }) => ({
  warehouse: one(warehouses, { fields: [warehouseBinStreets.warehouseId], references: [warehouses.id] }),
  racks: many(warehouseBinRacks),
}));

export const warehouseBinRacksRelations = relations(warehouseBinRacks, ({ one, many }) => ({
  street: one(warehouseBinStreets, { fields: [warehouseBinRacks.streetId], references: [warehouseBinStreets.id] }),
  cells: many(warehouseBinCells),
}));

export const warehouseBinCellsRelations = relations(warehouseBinCells, ({ one }) => ({
  rack: one(warehouseBinRacks, { fields: [warehouseBinCells.rackId], references: [warehouseBinRacks.id] }),
}));

export const sizeTypesRelations = relations(sizeTypes, ({ many }) => ({
  values: many(sizeValues),
}));

export const sizeValuesRelations = relations(sizeValues, ({ one }) => ({
  sizeType: one(sizeTypes, { fields: [sizeValues.sizeTypeId], references: [sizeTypes.id] }),
}));

export const measurementTypesRelations = relations(measurementTypes, ({ many }) => ({
  values: many(measurementValues),
}));

export const measurementValuesRelations = relations(measurementValues, ({ one }) => ({
  measurementType: one(measurementTypes, { fields: [measurementValues.measurementTypeId], references: [measurementTypes.id] }),
}));

export const fabricTypesRelations = relations(fabricTypes, ({ many }) => ({
  possibleMaterials: many(fabricTypePossibleMaterials),
}));

export const fabricTypePossibleMaterialsRelations = relations(fabricTypePossibleMaterials, ({ one }) => ({
  fabricType: one(fabricTypes, { fields: [fabricTypePossibleMaterials.fabricTypeId], references: [fabricTypes.id] }),
  material: one(materials, { fields: [fabricTypePossibleMaterials.materialId], references: [materials.id] }),
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
  characteristics: many(categoryCharacteristics),
}));

export const categoryCharacteristicsRelations = relations(categoryCharacteristics, ({ one }) => ({
  category: one(categories, { fields: [categoryCharacteristics.categoryId], references: [categories.id] }),
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
