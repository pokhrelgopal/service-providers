"use client";

import Link from "next/link";
import Image from "next/image";
import {
  HamburgerMenu,
  Clock,
  Notification,
  ShieldTick,
  Setting2,
  MessageQuestion,
  Briefcase,
  Logout,
} from "iconsax-reactjs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout, useMe } from "@/features/auth";

const ITEMS = [
  { label: "Request History", href: "/seeker/request-history", icon: Clock },
  { label: "Notifications", href: "/seeker/notifications", icon: Notification },
  { label: "Safety", href: "/seeker/safety", icon: ShieldTick },
  { label: "Settings", href: "/seeker/settings", icon: Setting2 },
  { label: "Help", href: "/seeker/help", icon: MessageQuestion },
];

export function SeekerMenu() {
  const logout = useLogout();
  const { data: me } = useMe();

  return (
    <div className="fixed top-4 left-4 z-1000">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu"
            className="text-foreground flex size-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            <HamburgerMenu size={22} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="z-1200 w-64 rounded-xl p-1.5"
        >
          {/* Logged-in seeker */}
          <div className="flex items-center gap-3 px-2 py-2">
            {me?.avatarUrl ? (
              <Image
                src={me.avatarUrl}
                alt={me.name}
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                {(me?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me?.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {me?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className="border-border my-1.5 h-0 border-t border-dashed bg-transparent" />

          {ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="cursor-pointer gap-1 py-2"
            >
              <Link href={item.href}>
                <item.icon size={18} className="text-muted-foreground" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="border-border my-1.5 h-0 border-t border-dashed bg-transparent" />
          <DropdownMenuItem asChild className="cursor-pointer gap-1 py-2">
            <Link href="/onboarding/provider">
              <Briefcase size={18} className="text-primary" />
              Become a Provider
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="border-border my-1.5 h-0 border-t border-dashed bg-transparent" />
          <DropdownMenuItem
            onClick={() => logout.mutate()}
            className="text-destructive focus:text-destructive cursor-pointer gap-1 py-2"
          >
            <Logout size={18} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
