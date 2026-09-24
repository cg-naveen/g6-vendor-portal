import { requireAdmin } from "@/lib/currentUser";
import { AppShell, type NavItem } from "@/components/AppShell";
import { IconInbox, IconUsers, IconSettings, IconUser, IconDocument, IconCard } from "@/components/icons";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const links: NavItem[] = [
    { href: "/admin", label: "Pending Approvals", icon: <IconInbox className="shrink-0" />, exact: true },
    { href: "/admin/vendors", label: "All Vendors", icon: <IconUsers className="shrink-0" /> },
    { href: "/admin/invoices", label: "All Invoices", icon: <IconDocument className="shrink-0" /> },
    { href: "/admin/staff", label: "Staff", icon: <IconUsers className="shrink-0" /> },
    { href: "/admin/payroll", label: "Payroll", icon: <IconCard className="shrink-0" /> },
    { href: "/admin/payroll-settings", label: "Payroll Settings", icon: <IconSettings className="shrink-0" /> },
    { href: "/admin/settings", label: "Billing Settings", icon: <IconSettings className="shrink-0" /> },
    { href: "/admin/profile", label: "Profile", icon: <IconUser className="shrink-0" /> },
  ];

  return (
    <AppShell portalLabel="Admin Console" navItems={links} userLabel="G6 Admin" userSubLabel={admin.email}>
      {children}
    </AppShell>
  );
}
