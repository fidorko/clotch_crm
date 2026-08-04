"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Boxes,
  BookOpen,
  CreditCard,
  FolderTree,
  Gem,
  Home,
  LayoutGrid,
  LogOut,
  Megaphone,
  Settings,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Truck,
  User,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// "Головна" — виняток: єдиний пункт з exact-match активністю (href "/" відразу
// редіректить на /products, startsWith зробив би його активним завжди).
const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Головна", icon: Home },
  { href: "/products", label: "Товари", icon: LayoutGrid },
  { href: "#", label: "Замовлення", icon: ShoppingCart },
  { href: "#", label: "Клієнти", icon: Users },
  { href: "#", label: "Постачальники", icon: Truck },
  { href: "/warehouse", label: "Склад", icon: Boxes },
  { href: "#", label: "Аналітика", icon: BarChart3 },
  { href: "#", label: "Маркетинг", icon: Megaphone },
];

// Підменю налаштувань — та сама навігація, що раніше жила в SettingsTabs
// (горизонтальні вкладки на /settings), тепер вертикально під «Налаштування»
// (розгортається інлайн, решта пунктів сайдбару лишається на місці); вибір
// розділу — через ?tab=, читає server component page.tsx.
const SETTINGS_NAV_ITEMS: NavItem[] = [
  { href: "/settings?tab=storefront", label: "Вітрина магазину", icon: Store },
  { href: "/settings?tab=general", label: "Загальні", icon: SlidersHorizontal },
  { href: "/settings?tab=categories", label: "Категорії товару", icon: FolderTree },
  { href: "/settings?tab=orders", label: "Замовлення", icon: ShoppingCart },
  { href: "/settings?tab=references", label: "Довідники", icon: BookOpen },
  { href: "/settings?tab=warehouses", label: "Склади", icon: Warehouse },
  { href: "/settings?tab=delivery", label: "Доставка", icon: Truck },
  { href: "/settings?tab=payment", label: "Оплата", icon: CreditCard },
  { href: "/settings?tab=plan", label: "Тарифний план", icon: Gem },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function isTabActive(pathname: string, searchTab: string | null, href: string): boolean {
  const [path, query] = href.split("?tab=");
  if (!pathname.startsWith(path)) return false;

  // Розділи з власними вкладеними маршрутами, не query-параметром (наразі
  // лише «Склади»: /settings/warehouses/new, /settings/warehouses/[id]) —
  // визначаємо за сегментом шляху. Без цієї гілки на таких сторінках
  // searchTab==null і спрацьовував дефолт "categories" нижче — підсвічувало
  // «Категорії товару» замість «Склади» (баг, помічено людиною 2026-08-04).
  if (pathname === `/settings/${query}` || pathname.startsWith(`/settings/${query}/`)) {
    return true;
  }
  if (pathname !== "/settings") return false;

  return (searchTab ?? "categories") === query;
}

function NavLink({
  item,
  active,
  compact,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        compact ? "px-2.5 py-1.5 text-[0.8rem]" : "px-3 py-2",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <item.icon className={cn("shrink-0", compact ? "size-4" : "size-4.5")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

// "Налаштування" сам по собі лише розгортає/згортає підменю — не веде на
// /settings (це відкривало б категорії за замовчуванням при кожному кліку).
function NavExpandButton({
  item,
  active,
  expanded,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const searchTab = useSearchParams().get("tab");
  const inSettings = pathname.startsWith("/settings");
  const [settingsExpanded, setSettingsExpanded] = useState(inSettings);
  const [wasInSettings, setWasInSettings] = useState(inSettings);

  // Захід на сторінку налаштувань (пряме посилання, кнопка "назад" тощо) —
  // підменю саме розгортається, щоб активний пункт було видно одразу
  // (adjusting-state-during-render, а не useEffect — react.dev/learn/you-might-not-need-an-effect).
  if (inSettings !== wasInSettings) {
    setWasInSettings(inSettings);
    if (inSettings) setSettingsExpanded(true);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4">
      <Link href="/" className="mb-4 flex shrink-0 items-center gap-2 px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Shirt className="size-4.5" />
        </span>
        <span className="truncate text-sm font-semibold tracking-wide text-sidebar-foreground uppercase">
          CRM Одягу
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.label} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="mt-1 flex flex-col gap-1 border-t border-sidebar-border pt-3">
          <NavExpandButton
            item={{ href: "/settings", label: "Налаштування", icon: Settings }}
            active={inSettings}
            expanded={settingsExpanded}
            onClick={() => setSettingsExpanded((expanded) => !expanded)}
          />
          {settingsExpanded && (
            <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
              {SETTINGS_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  active={isTabActive(pathname, searchTab, item.href)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t border-sidebar-border px-2 pt-3">
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <User className="size-4.5 shrink-0" />
          Обліковий запис
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4.5 shrink-0" />
          Вихід
        </Link>
      </div>
    </aside>
  );
}
