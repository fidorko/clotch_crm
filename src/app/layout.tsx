import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clotch CRM",
    template: "%s · Clotch CRM",
  },
  description: "CRM для магазинів одягу",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`}
        </Script>
        <TooltipProvider>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <main className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">{children}</main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
