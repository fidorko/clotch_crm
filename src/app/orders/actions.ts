"use server";

import { getCarrierProvider } from "@/server/carriers/carrier.factory";
import type { PrintDocumentsResult } from "@/server/carriers/carrier.interface";
import { getOrdersByIds } from "@/server/data/orders";
import { listDeliveryMethods } from "@/server/data/delivery-methods";
import {
  findDeliveryMethodEntitySettings,
  listAllDeliveryMethodEntitySettings,
} from "@/server/data/delivery-method-entity-settings";
import { getDevTenantId } from "@/server/tenant/get-tenant-id";

export interface PrintOrdersDocumentsResult {
  pdfs: string[];
  skipped: { orderId: string; reason: string }[];
}

/**
 * Пакетний друк ЕН/маркування зі списку замовлень (bulk «Друк ТТН»,
 * PrintTtnDialog.tsx, orders.md) — той самий provider.printDocuments(), що
 * printShipmentDocumentsAction (orders/new/actions.ts) для одного замовлення,
 * але групує вибрані id за (deliveryMethodId, legalEntityId): API-ключ
 * перевізника беремо з delivery_method_entity_settings конкретної юридичної
 * особи (settings-delivery.md), тож замовлення різних ЮО дають різні PDF.
 * orderIds з клієнта — лише список id, самі ref/apiKey читаються наново з
 * БД тут (tenant зі getDevTenantId(), не з клієнта, §6 CLAUDE.md) —
 * підробити чужий orderId не можна, getOrdersByIds фільтрує по tenantId.
 * Восьмий прохід — provider.printDocuments() повертає base64 PDF-байти, не
 * URL з apiKey (apiKey не повинен світитись в адресному рядку клієнта).
 * Замовлення без ЕН чи з непідтримуваним перевізником потрапляють у
 * skipped, не валять увесь пакет.
 */
export async function printOrdersDocumentsAction(
  orderIds: string[],
  kind: "document" | "marking"
): Promise<PrintOrdersDocumentsResult> {
  const tenantId = getDevTenantId();
  const [orderRows, methods, allEntitySettings] = await Promise.all([
    getOrdersByIds(tenantId, orderIds),
    listDeliveryMethods(tenantId),
    listAllDeliveryMethodEntitySettings(tenantId),
  ]);

  const skipped: { orderId: string; reason: string }[] = [];
  const groups = new Map<string, { deliveryMethodId: string; legalEntityId: string; entries: { orderId: string; ref: string }[] }>();

  for (const orderId of orderIds) {
    const order = orderRows.find((o) => o.id === orderId);
    if (!order) {
      skipped.push({ orderId, reason: "Замовлення не знайдено" });
      continue;
    }
    if (!order.carrierShipmentRef) {
      skipped.push({ orderId, reason: "ЕН ще не створено для цього замовлення" });
      continue;
    }
    if (!order.deliveryMethodId) {
      skipped.push({ orderId, reason: "Спосіб доставки не визначено" });
      continue;
    }
    const key = `${order.deliveryMethodId}:${order.legalEntityId}`;
    const group = groups.get(key) ?? { deliveryMethodId: order.deliveryMethodId, legalEntityId: order.legalEntityId, entries: [] };
    group.entries.push({ orderId, ref: order.carrierShipmentRef });
    groups.set(key, group);
  }

  const pdfs: string[] = [];
  for (const group of groups.values()) {
    const deliveryMethod = methods.find((m) => m.id === group.deliveryMethodId);
    if (!deliveryMethod || deliveryMethod.carrierKey !== "nova_poshta") {
      for (const { orderId } of group.entries) {
        skipped.push({ orderId, reason: "Друк підключено поки лише для Нової пошти" });
      }
      continue;
    }
    const entitySettings = findDeliveryMethodEntitySettings(allEntitySettings, group.deliveryMethodId, group.legalEntityId);
    if (!entitySettings?.apiKey) {
      for (const { orderId } of group.entries) {
        skipped.push({ orderId, reason: "У способу доставки не задано API-ключ (settings → Доставка)" });
      }
      continue;
    }
    try {
      const provider = getCarrierProvider(deliveryMethod.carrierKey, entitySettings.apiKey);
      const result: PrintDocumentsResult = await provider.printDocuments({
        documentRefs: group.entries.map((e) => e.ref),
        kind,
      });
      pdfs.push(result.pdfBase64);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Не вдалося сформувати друк";
      for (const { orderId } of group.entries) skipped.push({ orderId, reason });
    }
  }

  return { pdfs, skipped };
}
