export interface NbuRate {
  code: string;
  rate: number;
  date: string;
}

/**
 * Курс НБУ на сьогодні для конкретного коду валюти (ISO 4217, напр. "USD").
 * Публічний API без ключа: https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange
 * Контракт полів (cc/rate/exchangedate) — задокументована й стабільна структура
 * НБУ, але живий виклик не перевірявся в цій сесії (без мережевого доступу з
 * пісочниці) — перший реальний виклик з UI варто перевірити.
 */
export async function fetchNbuRate(code: string): Promise<NbuRate | null> {
  const url = `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${encodeURIComponent(code)}&json`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`НБУ повернув помилку ${response.status} для ${code}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const entry = data[0] as { cc?: string; rate?: number; exchangedate?: string };
  if (typeof entry.rate !== "number" || !entry.exchangedate) return null;
  return { code: entry.cc ?? code, rate: entry.rate, date: entry.exchangedate };
}
