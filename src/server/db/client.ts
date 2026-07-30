import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __clotchDbClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.APP_DATABASE_URL;
if (!connectionString) {
  throw new Error("APP_DATABASE_URL не задано — див. docs/env.md");
}

// HMR у Next.js dev-режимі перестворює модулі при кожному збереженні файлу —
// без кешування на globalThis кожен hot-reload плодив би нове з'єднання до Postgres.
const client = globalThis.__clotchDbClient ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") {
  globalThis.__clotchDbClient = client;
}

export const db = drizzle(client, { schema });

/**
 * Єдина крапка входу для тенант-скоупованих запитів. Виставляє сесійну змінну
 * app.tenant_id (транзакційно, через set_config(..., true)), яку читає RLS-політика
 * tenantIsolationPolicy — це другий рубіж захисту (розділ 6 CLAUDE.md) поверх
 * фільтра tenant_id у самому запиті.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
    return fn(tx);
  });
}
