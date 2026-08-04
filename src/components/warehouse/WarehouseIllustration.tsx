// Флет-ілюстрація складу для картки (замінила монохромну lucide-іконку) —
// будівля + ящики у дверях, за зразком-скріном людини. Інлайн SVG, кольори —
// лише існуючі токени палітри (design.md), нових кольорів не додавав.
export function WarehouseIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M3 17 L20 6 L37 17 L37 20 L3 20 Z" className="fill-accent-foreground" />
      <rect x="5.5" y="19" width="29" height="15" rx="1.5" className="fill-accent-foreground/80" />
      <rect x="14.5" y="24.5" width="11" height="9.5" rx="1" className="fill-card" />
      <rect x="16" y="27.7" width="3.4" height="3.4" rx="0.4" className="fill-warning" />
      <rect x="20.2" y="29.2" width="3.4" height="3.4" rx="0.4" className="fill-warning/75" />
    </svg>
  );
}
