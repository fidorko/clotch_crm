import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DevBlockLabel({
  name,
  enabled,
  stretch,
  children,
}: {
  name: string;
  enabled: boolean;
  // h-full — лише коли справді потрібно передати висоту далі (стретчнута
  // грід-комірка → картка всередині, ProductGeneralTab): CSS ігнорує
  // height:100% на елементі, чий батько має height:auto, тож без явної
  // висоти тут ланцюжок рветься (products.md). За замовчуванням false —
  // інакше в flex-column сторінці (заголовок + контент як сусідні flex-item,
  // напр. settings/page.tsx) h-full конкурує з сусідом за висоту і роздуває
  // обгортку, зіштовхуючи решту вниз (ловили на WarehousesTab, 2026-08-03).
  stretch?: boolean;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;

  return (
    <div
      className={cn(
        "relative outline outline-dashed outline-1 outline-amber-400/60 outline-offset-2",
        stretch && "h-full min-h-0"
      )}
    >
      <span className="absolute top-1 left-1 z-50 rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white shadow-sm select-text cursor-text">
        {name}
      </span>
      {children}
    </div>
  );
}
