import { HeaderActions } from "@/components/layout/HeaderActions";

export function SettingsHeader() {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="text-foreground">Налаштування</span>
        </nav>
        <HeaderActions />
      </div>

      <h1 className="text-2xl font-semibold text-foreground">Налаштування</h1>
    </div>
  );
}
