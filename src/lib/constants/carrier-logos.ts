// Лого перевізників (public/carriers/) — за прямою вказівкою людини, для
// візуального розрізнення рядків у DeliveryTab.tsx і заголовку попапу
// редагування. Ключ — carrierKey (delivery_methods.carrier_key), не в кожного
// довільного способу доставки, доданого тенантом, є лого — тоді просто
// показуємо назву без іконки.
export const CARRIER_LOGOS: Record<string, string> = {
  pickup: "/carriers/pickup.png",
  nova_poshta: "/carriers/nova_poshta.png",
  ukrposhta: "/carriers/ukrposhta.webp",
  meest_express: "/carriers/meest_express.png",
};

// 4 стартові способи доставки, засіяні db:seed (lib/mocks/delivery-methods.ts)
// — системні, назва не редагується в попапі (2026-08-06, сьомий прохід, пряма
// вказівка людини: "Нова пошта тут не редагується, це системний спосіб
// доставки"). Довільний спосіб, доданий тенантом, у цей список не входить.
export const SYSTEM_CARRIER_KEYS: string[] = ["pickup", "nova_poshta", "ukrposhta", "meest_express"];
