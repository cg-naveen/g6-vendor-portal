import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import type { VendorStatus } from "@prisma/client";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

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
        <h1 className="text-xl font-semibold text-zinc-900">All Vendors</h1>
        <div className="flex gap-2 text-sm">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/vendors" : `/admin/vendors?status=${s}`}
              className={`rounded-md px-3 py-1.5 ${
                (s === "ALL" && !filter) || filter === s ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 border border-zinc-300"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Account Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">{vendorDisplayName(v)}</td>
                <td className="px-4 py-3">{v.type === "BUSINESS" ? "Business" : "Individual"}</td>
                <td className="px-4 py-3">{v.accountType ? ACCOUNT_TYPE_LABEL[v.accountType] : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[v.status]}`}>{v.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/vendors/${v.id}`} className="text-indigo-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
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
