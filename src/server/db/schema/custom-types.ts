import { customType } from "drizzle-orm/pg-core";

// postgres.js повертає bytea-колонки як Buffer одразу з коробки — толочити
// toDriver/fromDriver нема потреби, значення проходить без перетворення.
export const bytea = customType<{ data: Buffer }>({
  dataType: () => "bytea",
});
