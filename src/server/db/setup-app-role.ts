import postgres from "postgres";

/**
 * Одноразовий (ідемпотентний) адмін-скрипт: створює non-owner Postgres-роль
 * app_user, під якою реально діє RLS (власник схеми, яким котяться міграції,
 * обходить RLS за замовчуванням). Підключається як DATABASE_URL (owner).
 * user/password беруться з APP_DATABASE_URL у .env — довірене локальне
 * джерело (не клієнтський ввід), тому пряма інтерполяція в DDL тут доречна;
 * для запитів застосунку скрізь використовується параметризований query builder.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const appDatabaseUrl = process.env.APP_DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL не задано — див. docs/env.md");
  if (!appDatabaseUrl) throw new Error("APP_DATABASE_URL не задано — див. docs/env.md");

  const appUrl = new URL(appDatabaseUrl);
  const appUser = appUrl.username;
  const appPassword = decodeURIComponent(appUrl.password);
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!appUser || !appPassword) {
    throw new Error("APP_DATABASE_URL має містити user:password — див. .env.example");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  await sql.unsafe(`
    DO $do$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${appUser}') THEN
        CREATE ROLE "${appUser}" LOGIN PASSWORD '${appPassword}';
      ELSE
        ALTER ROLE "${appUser}" PASSWORD '${appPassword}';
      END IF;
    END
    $do$;
  `);
  await sql.unsafe(`GRANT CONNECT ON DATABASE "${dbName}" TO "${appUser}"`);
  await sql.unsafe(`GRANT USAGE ON SCHEMA public TO "${appUser}"`);
  await sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${appUser}"`);
  await sql.unsafe(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${appUser}"`
  );

  console.log(`Роль "${appUser}" готова (non-owner, під неї діють RLS-політики).`);
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
