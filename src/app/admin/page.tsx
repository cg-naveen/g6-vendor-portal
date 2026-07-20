import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { getOrgFinancialSummary, formatMoney } from "@/lib/stats";
import { StatCard } from "@/components/StatCard";
import { RunBillingButton } from "./RunBillingButton";

export default async function AdminDashboard() {
  const [pending, summary, vendorCount] = await Promise.all([
    prisma.vendor.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    getOrgFinancialSummary(),
    prisma.vendor.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">Admin Overview</h1>
        <div className="flex items-center gap-3">
          <RunBillingButton />
          <Link href="/admin/vendors/new" className="g6-btn g6-btn-primary">
            + Add Vendor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatMoney(summary.outstanding)} hint={`${summary.outstandingCount} pending`} hintColor="pending" />
        <StatCard label="Paid" value={formatMoney(summary.paid)} hint={`${summary.paidCount} settled`} hintColor="paid" />
        <StatCard label="Active vendors" value={String(vendorCount)} hint={`${pending.length} awaiting review`} hintColor="muted" />
      </div>

      <div>
        <h2 className="g6-section-label mb-3">Pending Vendor Approvals</h2>
        <div className="g6-table-wrap">
          <table className="g6-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Registered</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.map((v) => (
                <tr key={v.id}>
                  <td className="font-medium">{vendorDisplayName(v)}</td>
                  <td>{v.type === "BUSINESS" ? "Business" : "Individual"}</td>
                  <td>{v.vendorEmail}</td>
                  <td>{v.createdAt.toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/vendors/${v.id}`} className="text-[#9d84ff] hover:text-[#cabfff]">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5c5770]">
                    No pending registrations.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
