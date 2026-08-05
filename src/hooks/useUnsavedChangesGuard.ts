"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Перехоплює клік по внутрішньому <Link> (той самий origin), поки
 * shouldBlock === true, і питає підтвердження перед переходом —
 * warehouse-receiving.md, сторінка створення надходження. Свідомо НЕ чіпає
 * beforeunload/кнопку «Назад» браузера (та сама межа, що вже узгоджена
 * раніше для форми товару, decisions.md) — Next.js App Router не дає
 * надійного способу перехопити їх без нативних подій навігації.
 */
export function useUnsavedChangesGuard(shouldBlock: boolean, message: string): void {
  const router = useRouter();

  useEffect(() => {
    if (!shouldBlock) return;

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      if (window.confirm(message)) {
        router.push(url.pathname + url.search + url.hash);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [shouldBlock, message, router]);
}
