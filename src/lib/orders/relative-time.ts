// "N хв/год тому" — для listOrdersForList (server/data/orders.ts, четвертий
// прохід — реальний список замовлень, замінив lib/mocks/orders.ts).
function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "дні";
  return "днів";
}

export function formatRelativeUa(minutesAgo: number): string {
  if (minutesAgo < 60) return `${Math.max(1, minutesAgo)} хв тому`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "учора";
  return `${days} ${pluralDays(days)} тому`;
}
