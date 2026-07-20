import { requireVendor } from "@/lib/currentUser";
import { AppShell, type NavItem } from "@/components/AppShell";
import { vendorDisplayName } from "@/lib/invoice";
import { IconDashboard, IconUpload, IconList, IconDocument, IconSettings, IconUser } from "@/components/icons";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const vendor = await requireVendor();

  const links: NavItem[] = [{ href: "/vendor", label: "Dashboard", icon: <IconDashboard className="shrink-0" />, exact: true }];
  if (vendor.status === "APPROVED") {
    if (vendor.accountType === "BUSINESS") {
      links.push({ href: "/vendor/bills", label: "Bills", icon: <IconUpload className="shrink-0" /> });
    }
    if (vendor.accountType === "FREELANCER") {
      links.push({ href: "/vendor/tasks", label: "Task Entries", icon: <IconList className="shrink-0" /> });
    }
    if (vendor.accountType === "FREELANCER" || vendor.accountType === "CONTRACT_FREELANCER") {
      links.push({ href: "/vendor/invoices", label: "Invoices", icon: <IconDocument className="shrink-0" /> });
      links.push({ href: "/vendor/invoice-settings", label: "Invoice Settings", icon: <IconSettings className="shrink-0" /> });
    }
  }
  links.push({ href: "/vendor/profile", label: "Profile", icon: <IconUser className="shrink-0" /> });

  return (
    <AppShell portalLabel="Vendor Portal" navItems={links} userLabel={vendorDisplayName(vendor)} userSubLabel={vendor.vendorEmail}>
      {children}
    </AppShell>
  );
}
