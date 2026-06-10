import {
  Element3,
  CalendarTick,
  Briefcase,
  Messages1,
  Box,
  Wallet3,
  Star1,
  User,
  Clock,
  MessageQuestion,
  type Icon,
} from "iconsax-reactjs";

export interface NavItem {
  label: string;
  href: string;
  icon: Icon;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

/** Provider sidebar menu. Seeker navigation comes later. */
export const PROVIDER_NAV: NavGroup[] = [
  {
    heading: "Menu",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Element3 },
      {
        label: "Booking Requests",
        href: "/booking-requests",
        icon: CalendarTick,
      },
      { label: "My Jobs", href: "/my-jobs", icon: Briefcase },
      { label: "Messages", href: "/messages", icon: Messages1 },
    ],
  },
  {
    heading: "Services",
    items: [
      { label: "My Services", href: "/my-services", icon: Box },
      { label: "Earnings", href: "/earnings", icon: Wallet3 },
      { label: "Reviews", href: "/reviews", icon: Star1 },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "My Profile", href: "/profile", icon: User },
      { label: "Availability", href: "/availability", icon: Clock },
    ],
  },
  {
    heading: "General",
    items: [
      { label: "Help & Support", href: "/help", icon: MessageQuestion },
    ],
  },
];
