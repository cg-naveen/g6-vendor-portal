import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";

export default async function AdminDashboard() {
  const pending = await prisma.vendor.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900">Pending Vendor Approvals</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pending.map((v) => (
              <tr key={v.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">{vendorDisplayName(v)}</td>
                <td className="px-4 py-3">{v.type === "BUSINESS" ? "Business" : "Individual"}</td>
                <td className="px-4 py-3">{v.vendorEmail}</td>
                <td className="px-4 py-3">{v.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/vendors/${v.id}`} className="text-indigo-600 hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {pending.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No pending registrations.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
