import { Sidebar } from "@/components/layout/Sidebar";

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-x-hidden">{children}</main>
    </div>
  );
}
