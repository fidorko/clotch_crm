// Джерело для db:seed — стартові 4 способи доставки. Жодних API-ключів тут:
// секрети в моки/сід-джерела не пишуться (conventions.md). Ключ Нової пошти
// (якщо є в NP_API_KEY) підставляється окремим кроком у seed.ts, не звідси.
export const mockDeliveryMethods: {
  carrierKey: string;
  name: string;
  requiresApiKey: boolean;
  isEnabled: boolean;
}[] = [
  { carrierKey: "pickup", name: "Самовивіз", requiresApiKey: false, isEnabled: true },
  { carrierKey: "nova_poshta", name: "Нова Пошта", requiresApiKey: true, isEnabled: false },
  { carrierKey: "ukrposhta", name: "Укрпошта", requiresApiKey: true, isEnabled: false },
  { carrierKey: "meest_express", name: "Meest Express", requiresApiKey: true, isEnabled: false },
];
