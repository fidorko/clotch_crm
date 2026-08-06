// Опис вантажу для ЕН — береться реально з налаштувань способу доставки
// (delivery_method_entity_settings.descriptionContent/descriptionIncludeQuantity)
// і карток товару, не вводиться вручну (третій прохід, пряма вказівка людини).
// Чиста функція — використовується і на клієнті (живий прев'ю в
// OrderDeliveryCard, orderNumber=null), і на сервері (авторитетне значення,
// що реально йде в createShipment, actions.ts — не довіряти клієнту, §6 CLAUDE.md).
export type ShipmentDescriptionContent = "order_id" | "product_sku" | "product_names";

export interface ShipmentDescriptionItem {
  productName: string;
  sku: string;
  quantity: number;
}

export function buildShipmentDescription(
  content: ShipmentDescriptionContent,
  includeQuantity: boolean,
  items: ShipmentDescriptionItem[],
  orderNumber: string | null
): string {
  if (content === "order_id") {
    return orderNumber ? `Замовлення ${orderNumber}` : "Замовлення (№ буде присвоєно при створенні)";
  }

  if (items.length === 0) return "";

  const field = content === "product_sku" ? "sku" : "productName";
  return items.map((item) => (includeQuantity ? `${item[field]} x${item.quantity}` : item[field])).join(", ");
}
