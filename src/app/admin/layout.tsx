import { requireAdmin } from "@/lib/currentUser";
import { NavBar } from "@/components/NavBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const links = [
    { href: "/admin", label: "Pending Approvals" },
    { href: "/admin/vendors", label: "All Vendors" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <NavBar title="G6 Admin" links={links} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
