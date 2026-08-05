# Обробка помилок

**Свідомо без хардкодженої таблиці кодів помилок.** Офіційний список (`developers.novaposhta.ua/listerrorscodes`) блокує бот-доступ (403) — переписувати коди «на око» з побічних джерел означало б вигадувати дані, що прямо суперечить конвенції проєкту (`conventions.md`, «не вигадуй»). Замість цього — генеричний підхід, що не залежить від повноти списку.

## Конверт відповіді (✅ перевірено живим викликом, `overview.md`)
Кожна відповідь API — завжди:
```
success: boolean
data: T[]
errors: string[]        — людські повідомлення
warnings: string[]      — напр. "Model is invalid"
errorCodes: string[]
warningCodes: string[]
```

## Стратегія `errors.ts`
- `success: false` → `NovaPoshtaApiError` з `.message` = перший елемент `errors` (або `warnings`, якщо `errors` порожній — саме так виглядала помилка неправильного `modelName`, `overview.md`), `.code` = перший елемент `errorCodes`/`warningCodes` (якщо є), `.raw` = весь конверт відповіді (для логування).
- Мережева помилка/timeout → `NovaPoshtaConnectionError`.
- Виклик методу, якого немає в `NovaPoshtaProvider` (ще не реалізований чи not supported) → `CarrierNotImplementedError`/`CarrierNotSupportedError` (`carrier.interface.ts`) — не та сама помилка, що вище: ця не долітає навіть до HTTP-виклику.

Коли з'явиться реальна потреба розрізняти конкретні коди (напр. «неправильний ключ» окремо від «місто не знайдено») — код і повідомлення й так приходять у `errors`/`errorCodes` з живої відповіді, немає потреби у випередженні готовою таблицею.
