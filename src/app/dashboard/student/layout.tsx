import Sidebar from "@/components/student/Sidebar";
import { BaseDashboardLayout } from "@/components/dashboard/layout/BaseDashboardLayout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseDashboardLayout
      sidebarComponent={<Sidebar studentName="Afker Ahmed" />}
      userRoleInitial="S"
    >
      {children}
    </BaseDashboardLayout>
  );
}
