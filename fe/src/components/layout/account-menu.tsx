"use client";

import { LogOutIcon, PackageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { logout } from "@/lib/auth";
import type { User } from "@/stores/auth-store";
import { useAuthStore } from "@/stores/auth-store";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

export function useLogout() {
  const t = useTranslations("Auth.account");
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  return async () => {
    await logout().catch(() => undefined);
    setUser(null);
    toast.success(t("loggedOut"));
    router.push("/");
  };
}

export function AccountMenu({ user }: { user: User }) {
  const t = useTranslations("Auth.account");
  const router = useRouter();
  const handleLogout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("menu")}
        className="flex cursor-pointer items-center gap-3 rounded-full border border-ink py-1 pr-4 pl-1 text-sm text-ink transition-colors hover:bg-ink hover:text-white data-popup-open:bg-ink data-popup-open:text-white group-data-[tone=light]/header:border-white group-data-[tone=light]/header:text-white"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-peanut text-sm font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="max-w-[140px] truncate">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 bg-cream">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col py-2">
            <span className="text-base font-semibold text-ink">{t("hello", { name: user.name })}</span>
            <span className="truncate text-xs font-normal text-dark-300">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account/orders")}>
          <PackageIcon />
          {t("orders")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOutIcon />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
