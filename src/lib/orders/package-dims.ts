// Сума габаритів кількох товарів у одну коробку відправлення (третій прохід
// редизайну /orders/new, пряма вказівка людини з прикладом: 20×30×5 і
// 25×35×7 → 25×35×12). Логіка пакування "в стос": найменший вимір кожного
// товару складається (це "висота стосу"), два інших виміри — беремо
// найбільше значення з усіх товарів (стос не ширший і не довший за
// найбільший товар). Кількість рядка (order_items.quantity) НЕ множить
// габарити — той самий підхід, що й раніше (тільки вага множиться на к-сть).
export interface PackageDims {
  length: number;
  width: number;
  height: number;
}

export function sumPackageDims(items: PackageDims[]): PackageDims | null {
  const withDims = items.filter((item) => item.length > 0 && item.width > 0 && item.height > 0);
  if (withDims.length === 0) return null;

  let heightSum = 0;
  let midMax = 0;
  let bigMax = 0;
  for (const item of withDims) {
    const [min, mid, big] = [item.length, item.width, item.height].sort((a, b) => a - b);
    heightSum += min;
    midMax = Math.max(midMax, mid);
    bigMax = Math.max(bigMax, big);
  }

  return { length: midMax, width: bigMax, height: heightSum };
}
