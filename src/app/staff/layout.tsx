import { AppShell, type NavItem } from "@/components/AppShell";
import { IconDashboard, IconDocument, IconUser } from "@/components/icons";
import { requireStaff } from "@/lib/currentUser";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireStaff();

  const links: NavItem[] = [
    { href: "/staff", label: "Dashboard", icon: <IconDashboard className="shrink-0" />, exact: true },
    { href: "/staff/payslips", label: "Payslips", icon: <IconDocument className="shrink-0" /> },
    { href: "/staff/profile", label: "Profile", icon: <IconUser className="shrink-0" /> },
  ];

  return (
    <AppShell
      portalLabel="Staff Portal"
      navItems={links}
      userLabel={employee.fullName}
      userSubLabel={employee.designation}
    >
      {children}
    </AppShell>
  );
}
