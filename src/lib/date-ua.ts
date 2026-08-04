// Дата DD.MM.YYYY — парсинг/формат, спільний для фільтрів і KPI списку
// надходжень (реальних і мок), warehouse-receiving.md.
export function parseUaDate(value: string): Date | null {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function formatTodayUa(): string {
  return formatDateUa(new Date()) as string;
}

export function formatDateUa(value: string | Date | null): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}
