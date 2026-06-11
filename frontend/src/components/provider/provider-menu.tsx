"use client";

import Link from "next/link";
import Image from "next/image";
import {
  HamburgerMenu,
  TickCircle,
  Wallet3,
  User,
  Setting2,
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

const SEP = "my-1.5 h-0 border-t border-dashed border-border bg-transparent";

const ITEMS = [
  { label: "Completed Jobs", href: "/completed-jobs", icon: TickCircle },
  { label: "Earnings", href: "/earnings", icon: Wallet3 },
];

export function ProviderMenu() {
  const logout = useLogout();
  const { data: me } = useMe();

  return (
    <div className="fixed left-4 top-4 z-[1000]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Menu"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-white text-foreground shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 active:scale-95"
          >
            <HamburgerMenu size={22} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={10}
          className="z-[1200] max-h-[80vh] w-64 overflow-y-auto rounded-xl p-1.5"
        >
          {/* Logged-in provider */}
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
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                {(me?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {me?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className={SEP} />

          {ITEMS.map((item) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="cursor-pointer gap-2.5 py-2.5"
            >
              <Link href={item.href}>
                <item.icon size={18} className="text-muted-foreground" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className={SEP} />

          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2.5">
            <Link href="/profile">
              <User size={18} className="text-muted-foreground" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2.5">
            <Link href="/settings">
              <Setting2 size={18} className="text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={SEP} />

          <DropdownMenuItem
            onClick={() => logout.mutate()}
            className="cursor-pointer gap-2.5 py-2.5 text-destructive focus:text-destructive"
          >
            <Logout size={18} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
