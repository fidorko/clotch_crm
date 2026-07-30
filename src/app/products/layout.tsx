import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Sidebar тепер глобальний (кореневий src/app/layout.tsx) — цей layout лишається
// лише заради robots-метаданих розділу (мультитенантні дані не індексуються).
export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
