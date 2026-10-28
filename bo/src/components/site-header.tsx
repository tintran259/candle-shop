"use client";

import { BellIcon, SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { allNavItems } from "@/lib/nav";

export function SiteHeader() {
  const pathname = usePathname();
  const current =
    allNavItems.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)))?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="font-heading text-lg font-semibold">{current}</h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm đơn hàng, sản phẩm…"
            aria-label="Tìm kiếm"
            className="h-9 w-64 rounded-full bg-surface pl-9"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Thông báo" className="relative rounded-full">
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ember" />
        </Button>
      </div>
    </header>
  );
}
