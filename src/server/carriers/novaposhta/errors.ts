// docs/carriers/novaposhta/errors.md — конверт відповіді API завжди містить
// success/errors/warnings/errorCodes, тому без вигаданої таблиці кодів помилок
// (офіційний список заблокований для бот-доступу) — просто прозоро переносимо,
// що повернуло саме API.

/** success:false у відповіді API — .message з errors (або warnings, якщо errors порожній — саме так виглядає "Model is invalid"). */
export class NovaPoshtaApiError extends Error {
  readonly code: string | undefined;
  readonly raw: unknown;

  constructor(message: string, code: string | undefined, raw: unknown) {
    super(message);
    this.name = "NovaPoshtaApiError";
    this.code = code;
    this.raw = raw;
  }
}

/** Мережева помилка / timeout до api.novaposhta.ua. */
export class NovaPoshtaConnectionError extends Error {
  constructor(cause: unknown) {
    super("Не вдалося з'єднатися з Новою поштою");
    this.name = "NovaPoshtaConnectionError";
    this.cause = cause;
  }
}
