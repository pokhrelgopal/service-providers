"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flash, type Icon } from "iconsax-reactjs";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

export interface ShellNavItem {
  label: string;
  href: string;
  icon: Icon;
  /** Match the pathname exactly (for index routes like /dashboard or /admin). */
  exact?: boolean;
}

export interface ShellNavGroup {
  heading?: string;
  items: ShellNavItem[];
}

function useIsActive() {
  const pathname = usePathname();
  return (item: ShellNavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function DashboardShell({
  brand,
  nav,
  profileHref,
  footerTop,
  children,
}: {
  brand: { name: string; subtitle: string };
  nav: ShellNavGroup[];
  profileHref?: string;
  /** Rendered in the sidebar footer, above the user menu (e.g. availability). */
  footerTop?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isActive = useIsActive();

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-gray-200/70">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href={nav[0]?.items[0]?.href ?? "/"}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Flash className="size-4" variant="Bold" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{brand.name}</span>
                    <span className="truncate text-xs">{brand.subtitle}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {nav.map((group, i) => (
            <SidebarGroup key={group.heading ?? i}>
              {group.heading && (
                <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className={cn(
                          active &&
                            "rounded-md bg-primary text-white hover:bg-primary hover:text-white",
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon
                            className="!size-5"
                            variant={active ? "Bold" : "Linear"}
                          />
                          <span className="text-[14px]">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          {footerTop}
          <NavUser profileHref={profileHref} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-gray-50">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1300px] flex-1 flex-col gap-4 px-4 pb-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
