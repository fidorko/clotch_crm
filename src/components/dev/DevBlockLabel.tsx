import type { ReactNode } from "react";

export function DevBlockLabel({
  name,
  enabled,
  children,
}: {
  name: string;
  enabled: boolean;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;

  return (
    // h-full — інакше цей div (без явної висоти) розриває ланцюжок відсоткової
    // висоти між стретчнутою грід-коміркою і карткою всередині (карта теж на
    // h-full): CSS ігнорує height:100% на елементі, чий батько має height:auto.
    // Ловили як "панелі однакової висоти" не спрацьовувало, поки dev-мітки
    // ввімкнені (products.md).
    <div className="relative h-full outline outline-dashed outline-1 outline-amber-400/60 outline-offset-2">
      <span className="absolute top-1 left-1 z-50 rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-white shadow-sm select-text cursor-text">
        {name}
      </span>
      {children}
    </div>
  );
}
