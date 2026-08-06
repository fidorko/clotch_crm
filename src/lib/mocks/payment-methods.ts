import type { PaymentMethodKind } from "@/server/data/payment-methods";

// Джерело для db:seed — стартові 4 способи оплати (пряма вказівка людини).
// partialAmount для "Часткова оплата" навмисно не засіяно (NULL) — суму
// задає людина сама через попап редагування (settings-payment.md).
export const mockPaymentMethods: {
  kind: PaymentMethodKind;
  name: string;
  isEnabled: boolean;
}[] = [
  { kind: "bank_transfer", name: "Оплата по реквізитах", isEnabled: true },
  { kind: "card_online", name: "Оплата карткою на сайті", isEnabled: true },
  { kind: "partial_payment", name: "Часткова оплата", isEnabled: true },
  { kind: "cash_on_delivery", name: "Оплата при отриманні", isEnabled: true },
];
