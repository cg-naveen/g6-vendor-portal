import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function BillsPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "BUSINESS") {
    redirect("/vendor");
  }

  const bills = await prisma.bill.findMany({ where: { vendorId: vendor.id }, orderBy: { submittedAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Your Bills</h1>
        <Link href="/vendor/bills/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Upload New Bill
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">{bill.submittedAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">{bill.description || "—"}</td>
                <td className="px-4 py-3">{Number(bill.amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[bill.status]}`}>{bill.status}</span>
                </td>
                <td className="px-4 py-3">
                  <a href={`/api/bills/${bill.id}/file`} className="text-indigo-600 hover:underline">
                    {bill.fileName}
                  </a>
                </td>
              </tr>
            ))}
            {bills.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No bills submitted yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
