"use client";

import {
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TicketPercentIcon,
  UsersIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { navGroups } from "@/lib/nav";

const icons = {
  dashboard: LayoutDashboardIcon,
  orders: ShoppingBagIcon,
  products: PackageIcon,
  customers: UsersIcon,
  reviews: MessageSquareIcon,
  discounts: TicketPercentIcon,
  settings: SettingsIcon,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="items-center py-6 group-data-[collapsible=icon]:py-4">
        <Link href="/" aria-label="2510 Scented Candle — Back office" className="flex flex-col items-center gap-2">
          <Image
            src="/logo-2510-vertical-light.png"
            alt="2510 Scented Candle"
            width={534}
            height={622}
            priority
            className="h-16 w-auto transition-all group-data-[collapsible=icon]:h-8"
          />
          <span className="text-[11px] tracking-[0.24em] text-sidebar-foreground/60 uppercase group-data-[collapsible=icon]:hidden">
            Back office
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/50">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = icons[item.icon];
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        render={<Link href={item.href} />}
                        className="h-10 data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground"
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="rounded-full bg-ember px-1.5 text-white">{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-2 group-data-[collapsible=icon]:p-0">
          <Avatar className="size-8">
            <AvatarFallback className="bg-peanut text-xs font-semibold text-ink">AD</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-white">Admin 2510</span>
            <span className="truncate text-xs text-sidebar-foreground/60">admin@2510candle.vn</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
