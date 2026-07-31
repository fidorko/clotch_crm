import { and, asc, count, eq } from "drizzle-orm";
import { withTenant } from "@/server/db/client";
import { currencies } from "@/server/db/schema";

export type CurrencyRow = typeof currencies.$inferSelect;

export interface CurrencyInput {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: "before" | "after";
  decimalPlaces: number;
  isActive: boolean;
  isDefault: boolean;
  autoUpdate: boolean;
}

function pgErrorCode(error: unknown): string | undefined {
  return error instanceof Error && error.cause instanceof Error && "code" in error.cause
    ? (error.cause as { code?: string }).code
    : undefined;
}

function friendlyError(error: unknown): never {
  if (pgErrorCode(error) === "23505") {
    throw new Error("Валюта з таким кодом (або друга «за замовчуванням») вже існує");
  }
  throw error;
}

export async function listCurrencies(tenantId: string): Promise<CurrencyRow[]> {
  return withTenant(tenantId, async (tx) =>
    tx
      .select()
      .from(currencies)
      .where(eq(currencies.tenantId, tenantId))
      .orderBy(asc(currencies.position), asc(currencies.createdAt))
  );
}

type Tx = Parameters<Parameters<typeof withTenant<void>>[1]>[0];

/**
 * Знімає is_default з усіх валют тенанта — лише одна може бути базовою (і
 * частковий UNIQUE у БД це підтверджує). Виклик завжди йде перед тим, як сама
 * ціль отримує is_default=true в тій самій транзакції — тимчасово "нуль
 * базових валют" ніколи не видно ззовні.
 */
async function clearAllDefaults(tx: Tx, tenantId: string): Promise<void> {
  await tx
    .update(currencies)
    .set({ isDefault: false })
    .where(and(eq(currencies.tenantId, tenantId), eq(currencies.isDefault, true)));
}

export async function createCurrency(tenantId: string, input: CurrencyInput): Promise<CurrencyRow> {
  return withTenant(tenantId, async (tx) => {
    try {
      if (input.isDefault) {
        await clearAllDefaults(tx, tenantId);
      }
      const [{ total }] = await tx
        .select({ total: count() })
        .from(currencies)
        .where(eq(currencies.tenantId, tenantId));
      const [row] = await tx
        .insert(currencies)
        .values({
          tenantId,
          code: input.code,
          name: input.name,
          symbol: input.symbol,
          symbolPosition: input.symbolPosition,
          decimalPlaces: input.decimalPlaces,
          isActive: input.isActive,
          isDefault: input.isDefault,
          autoUpdate: input.autoUpdate,
          position: total,
        })
        .returning();
      return row;
    } catch (error) {
      friendlyError(error);
    }
  });
}

export async function updateCurrency(
  tenantId: string,
  id: string,
  input: CurrencyInput
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    try {
      if (input.isDefault) {
        await clearAllDefaults(tx, tenantId);
      } else {
        // Тенант завжди повинен мати рівно одну базову валюту (курси інших
        // рахуються відносно неї) — не можна зняти прапорець з єдиної базової,
        // не призначивши іншу. Знайдено живим тестуванням: без цієї перевірки
        // тенант лишався взагалі без базової валюти.
        const [current] = await tx
          .select({ isDefault: currencies.isDefault })
          .from(currencies)
          .where(and(eq(currencies.tenantId, tenantId), eq(currencies.id, id)));
        if (current?.isDefault) {
          throw new Error(
            "Це базова валюта — спочатку призначте базовою іншу, тоді ця сама перестане бути базовою"
          );
        }
      }
      await tx
        .update(currencies)
        .set({
          code: input.code,
          name: input.name,
          symbol: input.symbol,
          symbolPosition: input.symbolPosition,
          decimalPlaces: input.decimalPlaces,
          isActive: input.isActive,
          isDefault: input.isDefault,
          autoUpdate: input.autoUpdate,
          updatedAt: new Date(),
        })
        .where(and(eq(currencies.tenantId, tenantId), eq(currencies.id, id)));
    } catch (error) {
      friendlyError(error);
    }
  });
}

export async function updateCurrencyRate(tenantId: string, id: string, rate: number): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx
      .update(currencies)
      .set({ exchangeRate: String(rate), rateUpdatedAt: new Date() })
      .where(and(eq(currencies.tenantId, tenantId), eq(currencies.id, id)));
  });
}

/** Базову валюту видалити не можна — спочатку призначте іншу базовою. */
export async function deleteCurrency(tenantId: string, id: string): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    const [row] = await tx
      .select({ isDefault: currencies.isDefault })
      .from(currencies)
      .where(and(eq(currencies.tenantId, tenantId), eq(currencies.id, id)));
    if (row?.isDefault) {
      throw new Error("Не можна видалити валюту за замовчуванням — спочатку призначте іншу");
    }
    await tx.delete(currencies).where(and(eq(currencies.tenantId, tenantId), eq(currencies.id, id)));
  });
}
