import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import type { VendorStatus } from "@prisma/client";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  BUSINESS: "Business",
  FREELANCER: "Freelancer",
  CONTRACT_FREELANCER: "Contract Freelancer",
};

export default async function AllVendorsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status && ["PENDING", "APPROVED", "REJECTED"].includes(status) ? (status as VendorStatus) : undefined;

  const vendors = await prisma.vendor.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">All Vendors</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-[11px] bg-black/30 p-1 text-sm">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
              <Link
                key={s}
                href={s === "ALL" ? "/admin/vendors" : `/admin/vendors?status=${s}`}
                className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold ${
                  (s === "ALL" && !filter) || filter === s ? "bg-white/[0.08] text-[#ece9f5]" : "text-[#8781a0]"
                }`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
          <Link href="/admin/vendors/new" className="g6-btn g6-btn-primary">
            + Add Vendor
          </Link>
        </div>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Account Type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id}>
                <td className="font-medium">{vendorDisplayName(v)}</td>
                <td>{v.type === "BUSINESS" ? "Business" : "Individual"}</td>
                <td>{v.accountType ? ACCOUNT_TYPE_LABEL[v.accountType] : "—"}</td>
                <td>
                  <Badge variant={statusBadgeVariant(v.status)}>{v.status}</Badge>
                </td>
                <td>
                  <Link href={`/admin/vendors/${v.id}`} className="text-[#9d84ff] hover:text-[#cabfff]">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#5c5770]">
                  No vendors found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
