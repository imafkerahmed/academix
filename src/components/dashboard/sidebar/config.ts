import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  DollarSign,
  Video,
  Settings,
  BookOpen,
  CreditCard,
  User,
  FileEdit,
  FolderOpen,
} from "lucide-react";
import { MenuItem } from "./DashboardSidebar";

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "overview",
    label: "DASHBOARD",
    icon: LayoutDashboard,
    href: "/dashboard/admin",
  },
  {
    id: "students",
    label: "STUDENT DATABASE",
    icon: Users,
    href: "/dashboard/admin/students",
  },
  {
    id: "intakes",
    label: "ACADEMIC TERMS",
    icon: GraduationCap,
    href: "/dashboard/admin/intakes",
  },
  {
    id: "assignments",
    label: "ASSIGNMENT HUB",
    icon: FileText,
    href: "/dashboard/admin/assignments",
  },
  {
    id: "payments",
    label: "FINANCE & AUDIT",
    icon: DollarSign,
    href: "/dashboard/admin/payments",
  },
  {
    id: "classes",
    label: "CLASS SCHEDULER",
    icon: Video,
    href: "/dashboard/admin/classes",
  },
  {
    id: "settings",
    label: "SYSTEM SETTINGS",
    icon: Settings,
    href: "/dashboard/admin/settings",
  },
];

export const STUDENT_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: LayoutDashboard,
    href: "/dashboard/student",
  },
  {
    id: "courses",
    label: "MY COURSES",
    icon: BookOpen,
    href: "/dashboard/student/courses",
  },
  {
    id: "payments",
    label: "PAYMENTS",
    icon: CreditCard,
    href: "/dashboard/student/payments",
  },
  {
    id: "profile",
    label: "PROFILE",
    icon: User,
    href: "/dashboard/student/profile",
  },
];

export const LECTURER_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "DASHBOARD",
    icon: LayoutDashboard,
    href: "/dashboard/lecturer",
  },
  {
    id: "intakes",
    label: "INTAKES",
    icon: GraduationCap,
    href: "/dashboard/lecturer/intakes",
  },
  {
    id: "assignments",
    label: "ASSIGNMENTS",
    icon: FileEdit,
    href: "/dashboard/lecturer/assignments",
  },
  {
    id: "materials",
    label: "MATERIALS",
    icon: FolderOpen,
    href: "/dashboard/lecturer/materials",
  },
];
