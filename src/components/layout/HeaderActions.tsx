import Link from "next/link";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  MessageCircle,
  MessageSquareWarning,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DEV_USER } from "@/lib/constants/dev-user";

interface IconLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  dot?: boolean;
}

// Монохромні (за проханням людини — спершу зробив різнокольоровими, не
// сподобалось) іконки-заглушки: немає бекенду для замовлень/відгуків/
// сповіщень/чату/довідки — href="#", чесно, без вигаданих лічильників.
function IconLink({ href, label, icon: Icon, dot }: IconLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            aria-label={label}
            className="relative flex size-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          />
        }
      >
        <Icon className="size-4.5" />
        {dot && (
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rose-500" />
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// TODO(auth): DEV_USER — заглушка, поки немає сесій (lib/constants/dev-user.ts).
function UserMenu() {
  const initial = DEV_USER.name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-muted">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </span>
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="truncate text-sm font-medium text-foreground">{DEV_USER.name}</span>
          <span className="truncate text-xs text-muted-foreground">{DEV_USER.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem>Профіль</DropdownMenuItem>
        <DropdownMenuItem>Обліковий запис</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Вихід</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Спільний кластер праворуч у шапці кожної сторінки (ProductHeader/ProductsHeader/SettingsHeader). */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-0.5">
      <IconLink href="#" label="Вітрина магазину" icon={Store} />
      <IconLink href="#" label="Нові замовлення" icon={ShoppingBag} />
      <IconLink href="#" label="Відгуки на модерацію" icon={MessageSquareWarning} />
      <IconLink href="#" label="Сповіщення" icon={Bell} dot />
      <IconLink href="#" label="Чат підтримки" icon={MessageCircle} />
      <IconLink href="#" label="Довідка" icon={CircleHelp} />
      <ThemeToggle />
      <span className="mx-1.5 h-6 w-px shrink-0 bg-border" />
      <UserMenu />
    </div>
  );
}
