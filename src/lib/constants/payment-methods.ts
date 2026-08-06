import { Banknote, CreditCard, Landmark, SplitSquareHorizontal, Wallet, type LucideIcon } from "lucide-react";
import type { PaymentMethodKind } from "@/server/data/payment-methods";

// 4 стартові способи оплати, засіяні db:seed (lib/mocks/payment-methods.ts) —
// системні, назва не редагується в попапі (той самий підхід, що
// SYSTEM_CARRIER_KEYS у settings-delivery.md). Довільний спосіб, доданий
// тенантом ("+Додати спосіб оплати"), завжди kind="custom".
export const SYSTEM_PAYMENT_METHOD_KINDS: PaymentMethodKind[] = [
  "bank_transfer",
  "card_online",
  "partial_payment",
  "cash_on_delivery",
];

export const PAYMENT_METHOD_KIND_ICONS: Record<PaymentMethodKind, LucideIcon> = {
  bank_transfer: Landmark,
  card_online: CreditCard,
  partial_payment: SplitSquareHorizontal,
  cash_on_delivery: Wallet,
  custom: Banknote,
};
