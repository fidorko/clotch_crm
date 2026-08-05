import { NP_API_URL } from "./endpoints";
import { NovaPoshtaApiError, NovaPoshtaConnectionError } from "./errors";

interface NpEnvelope<T> {
  success: boolean;
  data: T[];
  errors?: string[];
  warnings?: string[];
  errorCodes?: string[];
  warningCodes?: string[];
}

/**
 * Єдина точка живого виклику api.novaposhta.ua (docs/carriers/novaposhta/overview.md,
 * "Конверт відповіді"). Увесь інший код цього провайдера йде тільки через цю
 * функцію — власний HTTP-клієнт, без SDK/npm-залежності (пряма вказівка людини).
 */
export async function callNovaPoshta<T>(
  apiKey: string,
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown> = {}
): Promise<T[]> {
  let response: Response;
  try {
    response = await fetch(NP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
    });
  } catch (error) {
    throw new NovaPoshtaConnectionError(error);
  }

  const envelope = (await response.json()) as NpEnvelope<T>;
  if (!envelope.success) {
    const message = envelope.errors?.[0] || envelope.warnings?.[0] || "Нова пошта повернула помилку";
    const code = envelope.errorCodes?.[0] || envelope.warningCodes?.[0];
    throw new NovaPoshtaApiError(message, code, envelope);
  }
  return envelope.data;
}
