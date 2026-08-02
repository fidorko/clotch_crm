# Env

## Запуск (розробка)
`npm run dev` — Next.js dev-сервер. Перед стартом (`predev`-хук у `package.json`) автоматично: накочує міграції (`db:migrate`) і оновлює non-owner роль `app_user` (`db:setup-role`) на БД з `.env` — усе ідемпотентно, повторний запуск нічого зайвого не робить.

БД — Supabase (hosted Postgres, спільна для всіх ПК розробки: однакові дані незалежно від машини). Інтернет потрібен завжди. Локальний Docker Compose (`docker-compose.yml`) лишається в репо як офлайн-фолбек, але `predev` його більше не піднімає автоматично — за потреби `docker compose up -d --wait` вручну.

Дані (`db:seed`) — окремо, свідомо не автоматично (наповнення даними — рішення, не інфраструктурний бутстрап).

**Один порт.** Застосунок завжди піднімається на одному й тому самому порту (3000 за замовчуванням). Якщо запуск не вдався або потрібен перезапуск — спершу зупинити наявний процес, потім запускати знову. Не плодити паралельні процеси на різних портах.

## Змінні оточення
Скопіювати `.env.example` → `.env` (не комітиться). Значення для локальної розробки — підставні, реальні секрети сюди ніколи не пишуться.

| Змінна | Призначення |
|---|---|
| `DATABASE_URL` | Власник схеми (Supabase, Session pooler) — міграції (`drizzle-kit`), сід. Обходить RLS. |
| `APP_DATABASE_URL` | Non-owner роль `app_user` (Supabase, Session pooler) — запити застосунку (`src/server/db/client.ts`). RLS діє. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | `docker-compose.yml` — локальний офлайн-фолбек, не використовується за замовчуванням |
| `DEV_TENANT_ID` | `TODO(auth)` — тимчасовий tenantId, доки нема сесій. Див. `db.md`. |

## Supabase — підключення
Project ref `edgqipyltkrlvgniurvd`. Пряме підключення (`db.<ref>.supabase.co:5432`) резолвиться лише в IPv6 — у мережах без IPv6-маршруту таймаутить, тому підключення йде через **Session pooler** (`aws-0-eu-west-1.pooler.supabase.com:5432`, IPv4), не Transaction pooler (не годиться для DDL/міграцій). Username для pooler — `<role>.<project-ref>` (напр. `app_user.edgqipyltkrlvgniurvd`), сам Postgres-роль без суфікса (`app_user`) створює/оновлює `db:setup-role` за іменем з `APP_DATABASE_URL`. Роль уже створена й спільна — на новій машині досить скопіювати `.env`, повторний `db:setup-role` (через `predev`) лише підтвердить пароль, нічого не зламає.

## Перший запуск на новій машині
1. `.env` (скопіювати з `.env.example`, підставити реальні Supabase-креденшали — Dashboard → Project Settings → Database → Connection string → Session pooler).
2. `npm install`
3. `npm run dev` — `predev` сам накотить міграції/роль на спільну Supabase-базу.
4. `npm run db:seed` — одноразово (дані спільні, на другій машині вже не треба).

`npm run db:generate` — лише коли міняється сама схема (`src/server/db/schema/*.ts`), не при звичайному запуску. Деталі схеми, RLS та мультитенантності — `docs/db.md`.
