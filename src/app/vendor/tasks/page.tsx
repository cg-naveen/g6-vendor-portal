import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { Badge, statusBadgeVariant } from "@/components/Badge";

export default async function TasksPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "FREELANCER") {
    redirect("/vendor");
  }

  const submissions = await prisma.invoiceSubmission.findMany({
    where: { vendorId: vendor.id },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">Task Entries</h1>
        <Link href="/vendor/tasks/new" className="g6-btn g6-btn-primary">
          Submit New Tasks
        </Link>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Submitted</th>
              <th>Rows</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Invoice PDF</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const total = s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
              return (
                <tr key={s.id}>
                  <td className="font-mono-g6 font-medium">{s.invoiceNumber}</td>
                  <td>{s.createdAt.toLocaleDateString()}</td>
                  <td>{s.lineItems.length}</td>
                  <td className="font-mono-g6">{total.toFixed(2)}</td>
                  <td>
                    <Badge variant={statusBadgeVariant(s.paymentStatus)}>{s.paymentStatus}</Badge>
                  </td>
                  <td>
                    <a href={`/api/invoices/${s.id}/pdf`} target="_blank" className="text-[#9d84ff] hover:text-[#cabfff]">
                      View PDF
                    </a>
                    {s.receiptPath ? (
                      <>
                        {" · "}
                        <a href={`/api/invoices/${s.id}/receipt`} className="text-[#9d84ff] hover:text-[#cabfff]">
                          Receipt
                        </a>
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5c5770]">
                  No task entries submitted yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
