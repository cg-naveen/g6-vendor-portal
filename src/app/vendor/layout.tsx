import { requireVendor } from "@/lib/currentUser";
import { NavBar } from "@/components/NavBar";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const vendor = await requireVendor();

  const links = [{ href: "/vendor", label: "Dashboard" }];
  if (vendor.status === "APPROVED") {
    if (vendor.accountType === "BUSINESS") {
      links.push({ href: "/vendor/bills", label: "Bills" });
    }
    if (vendor.accountType === "FREELANCER") {
      links.push({ href: "/vendor/tasks", label: "Task Entries" });
    }
    if (vendor.accountType === "FREELANCER" || vendor.accountType === "CONTRACT_FREELANCER") {
      links.push({ href: "/vendor/invoices", label: "Invoices" });
      links.push({ href: "/vendor/invoice-settings", label: "Invoice Settings" });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <NavBar title="G6 Vendor Portal" links={links} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
