import { Element3, Profile2User, type Icon } from "iconsax-reactjs";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: Icon;
  /** Match the pathname exactly (for the index route). */
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: Element3, exact: true },
  { label: "Registrations", href: "/admin/registrations", icon: Profile2User },
];
