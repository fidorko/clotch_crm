import Link from "next/link";
import {
  Shirt,
  LayoutGrid,
  ShoppingCart,
  Users,
  Boxes,
  FolderKanban,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/products", label: "Товари", icon: LayoutGrid, active: true },
  { href: "#", label: "Замовлення", icon: ShoppingCart },
  { href: "#", label: "Клієнти", icon: Users },
  { href: "#", label: "Склад", icon: Boxes },
  { href: "#", label: "Постачальники", icon: FolderKanban },
  { href: "#", label: "Аналітика", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-16 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-4">
      <Link
        href="/products"
        className="mb-4 flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
      >
        <Shirt className="size-5" />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger
              render={
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    item.active &&
                      "bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary"
                  )}
                >
                  <item.icon className="size-5" />
                </Link>
              }
            />
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="#"
              className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="size-5" />
            </Link>
          }
        />
        <TooltipContent side="right">Налаштування</TooltipContent>
      </Tooltip>
    </aside>
  );
}
