// TODO(auth): замінити на tenantId із серверної сесії, коли з'явиться автентифікація.
// Сигнатури data-access шару (src/server/data/*) вже приймають tenantId як обов'язковий
// параметр — перехід на реальну сесію буде локальною заміною джерела значення в місцях
// виклику getDevTenantId(), а не переробкою архітектури.
export function getDevTenantId(): string {
  const tenantId = process.env.DEV_TENANT_ID;
  if (!tenantId) {
    throw new Error("DEV_TENANT_ID не задано — див. docs/env.md");
  }
  return tenantId;
}
