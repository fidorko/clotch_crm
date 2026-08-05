import {
  CARRIER_PROVIDER_METHODS,
  CarrierNotSupportedError,
  type CarrierProvider,
} from "./carrier.interface";
import { NovaPoshtaProvider } from "./novaposhta/provider";

/** Провайдер-заглушка — кожен метод одразу кидає контрольовану помилку (не крашить систему, пряма вимога людини) для перевізників без реальної інтеграції (Укрпошта/Meest/довільні, доданий тенантом). */
function createUnsupportedProvider(carrierKey: string): CarrierProvider {
  const provider = {} as Record<string, () => never>;
  for (const method of CARRIER_PROVIDER_METHODS) {
    provider[method] = () => {
      throw new CarrierNotSupportedError(carrierKey, method);
    };
  }
  return provider as unknown as CarrierProvider;
}

/**
 * Єдина точка входу для CRM — carrierKey + ключ тенанта дають готовий
 * CarrierProvider з універсальним інтерфейсом (carrier.interface.ts).
 * Додати нового перевізника — новий case тут, без зміни коду викликача.
 */
export function getCarrierProvider(carrierKey: string, apiKey: string | null): CarrierProvider {
  switch (carrierKey) {
    case "nova_poshta":
      if (!apiKey) return createUnsupportedProvider(carrierKey);
      return new NovaPoshtaProvider(apiKey);
    default:
      return createUnsupportedProvider(carrierKey);
  }
}
