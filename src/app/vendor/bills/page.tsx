import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { Badge, statusBadgeVariant } from "@/components/Badge";

export default async function BillsPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "BUSINESS") {
    redirect("/vendor");
  }

  const bills = await prisma.bill.findMany({ where: { vendorId: vendor.id }, orderBy: { submittedAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">Your Bills</h1>
        <Link href="/vendor/bills/new" className="g6-btn g6-btn-primary">
          Upload New Bill
        </Link>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.submittedAt.toLocaleDateString()}</td>
                <td>{bill.description || "—"}</td>
                <td className="font-mono-g6">{Number(bill.amount).toFixed(2)}</td>
                <td>
                  <Badge variant={statusBadgeVariant(bill.status)}>{bill.status}</Badge>
                </td>
                <td>
                  <Badge variant={statusBadgeVariant(bill.paymentStatus)}>{bill.paymentStatus}</Badge>
                </td>
                <td>
                  <a href={`/api/bills/${bill.id}/file`} className="text-[#9d84ff] hover:text-[#cabfff]">
                    {bill.fileName}
                  </a>
                  {bill.receiptPath ? (
                    <>
                      {" · "}
                      <a href={`/api/bills/${bill.id}/receipt`} className="text-[#9d84ff] hover:text-[#cabfff]">
                        Receipt
                      </a>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
            {bills.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5c5770]">
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
