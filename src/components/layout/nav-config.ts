import { Role } from "@prisma/client";
import {
  Boxes,
  ClipboardList,
  Cpu,
  CheckCircle2,
  Truck,
  ReceiptText,
  Users,
  Database,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    title: "Operations Floor",
    items: [
      {
        title: "Orders",
        href: "/orders",
        icon: ClipboardList,
        roles: [Role.ADMIN, Role.SUPERVISOR, Role.ACCOUNTS, Role.STORE],
      },
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
        roles: [Role.ADMIN, Role.STORE],
      },
      {
        title: "Production",
        href: "/production",
        icon: Cpu,
        roles: [Role.ADMIN, Role.SUPERVISOR],
      },
      {
        title: "Quality",
        href: "/quality",
        icon: CheckCircle2,
        roles: [Role.ADMIN, Role.QC, Role.SUPERVISOR],
      },
      {
        title: "Dispatch",
        href: "/dispatch",
        icon: Truck,
        roles: [Role.ADMIN, Role.STORE, Role.ACCOUNTS],
      },
    ],
  },
  {
    title: "Enterprise Management",
    items: [
      {
        title: "Finance",
        href: "/finance",
        icon: ReceiptText,
        roles: [Role.ADMIN, Role.ACCOUNTS],
      },
      {
        title: "HR & Attendance",
        href: "/hr",
        icon: Users,
        roles: [Role.ADMIN],
      },
      {
        title: "Expenses",
        href: "/expenses",
        icon: CircleDollarSign,
        roles: [Role.ADMIN, Role.ACCOUNTS],
      },
      {
        title: "Master Data",
        href: "/master",
        icon: Database,
        roles: [Role.ADMIN, Role.STORE, Role.SUPERVISOR],
      },
    ],
  },
];

export function getFilteredNav(userRole: Role): NavGroup[] {
  return navigationConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);
}
