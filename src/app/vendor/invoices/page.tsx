import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER")) {
    redirect("/vendor");
  }

  const submissions = await prisma.invoiceSubmission.findMany({
    where: { vendorId: vendor.id },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900">Invoices</h1>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Entered By</th>
              <th className="px-4 py-3">Rows</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const total = s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
              return (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium">{s.invoiceNumber}</td>
                  <td className="px-4 py-3">{s.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">{s.source === "ADMIN" ? "G6 Admin" : "You"}</td>
                  <td className="px-4 py-3">{s.lineItems.length}</td>
                  <td className="px-4 py-3">{total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <a href={`/api/invoices/${s.id}/pdf`} target="_blank" className="text-indigo-600 hover:underline">
                      View PDF
                    </a>
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
