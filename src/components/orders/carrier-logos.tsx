// Наближена SVG-реконструкція лого перевізників за зображеннями, наданими
// людиною (не векторний трейс офіційних файлів — прямого доступу до
// вихідних asset'ів нема, лише скріншоти). Кольори — з наданих зображень.

export function NovaPoshtaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="15" y="15" width="70" height="70" rx="14" fill="#E30613" transform="rotate(45 50 50)" />
      <polygon points="50,14 40,30 60,30" fill="white" />
      <rect x="32" y="30" width="10" height="40" fill="white" />
      <rect x="58" y="30" width="10" height="40" fill="white" />
      <rect x="32" y="45" width="36" height="10" fill="white" />
      <polygon points="50,86 40,70 60,70" fill="white" />
    </svg>
  );
}

export function UkrposhtaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#FFC72C" />
      <path
        d="M42 25 C42 25 66 24 66 40 C66 53 49 53 40 53 L40 78"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
