// Проста флет-ілюстрація (немає окремого сховища зображень для декоративних
// SVG у проєкті) — людина з планшетом біля чек-листа, за зразком-скріном.
export function SupplierHintIllustration() {
  return (
    <svg viewBox="0 0 160 120" className="h-24 w-full" aria-hidden="true">
      <circle cx="80" cy="60" r="52" className="fill-sky-50 dark:fill-sky-500/10" />
      <rect
        x="70"
        y="18"
        width="46"
        height="46"
        rx="10"
        className="fill-violet-100 dark:fill-violet-500/15"
        transform="rotate(18 93 41)"
      />

      <rect x="52" y="26" width="46" height="60" rx="6" className="fill-white dark:fill-slate-800" />
      <rect x="52" y="26" width="46" height="60" rx="6" className="fill-none stroke-border" strokeWidth="1.5" />
      <rect x="65" y="22" width="20" height="8" rx="3" className="fill-sky-300 dark:fill-sky-400" />
      <line x1="60" y1="42" x2="90" y2="42" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="52" x2="90" y2="52" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="62" x2="80" y2="62" className="stroke-slate-200 dark:stroke-slate-600" strokeWidth="3" strokeLinecap="round" />
      <circle cx="70" cy="74" r="7" className="fill-emerald-100 dark:fill-emerald-500/20" />
      <path d="M67 74l2 2.5 4-5" className="fill-none stroke-emerald-500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="42" cy="70" r="8" className="fill-sky-400" />
      <path
        d="M30 108c0-11 6-19 12-19s12 8 12 19"
        className="fill-sky-500"
      />
      <rect x="46" y="86" width="14" height="18" rx="3" className="fill-white dark:fill-slate-700 stroke-border" strokeWidth="1.2" />
      <line x1="49" y1="91" x2="57" y2="91" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="49" y1="96" x2="57" y2="96" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
