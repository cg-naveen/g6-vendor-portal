import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import { DeleteInvoiceButton } from "@/components/DeleteInvoiceButton";
import { deleteTaskEntry } from "@/actions/tasks";

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
      <h1 className="g6-page-title">Invoices</h1>
      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Entered By</th>
              <th>Rows</th>
              <th>Total</th>
              <th>Payment</th>
              <th>PDF</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const total = s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
              return (
                <tr key={s.id}>
                  <td className="font-mono-g6 font-medium">
                    {s.invoiceNumber}
                    {s.isRecurring ? <span className="ml-2 text-[10px] text-[#8781a0]">(auto)</span> : null}
                  </td>
                  <td>{s.createdAt.toLocaleDateString()}</td>
                  <td>{s.source === "ADMIN" ? "G6 Admin" : "You"}</td>
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
                  <td>
                    {s.source === "VENDOR" && s.paymentStatus === "UNPAID" ? (
                      <div className="flex items-center gap-3 text-xs">
                        <Link href={`/vendor/tasks/${s.id}/edit`} className="text-[#9d84ff] hover:text-[#cabfff]">
                          Edit
                        </Link>
                        <DeleteInvoiceButton action={deleteTaskEntry.bind(null, s.id)} />
                      </div>
                    ) : (
                      <span className="text-xs text-[#5c5770]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5c5770]">
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
