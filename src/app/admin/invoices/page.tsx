import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import { MarkInvoicePaidInline, MarkInvoiceUnpaidButton } from "./InvoiceActions";
import type { PaymentStatus } from "@prisma/client";

export default async function AllInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; vendorId?: string }>;
}) {
  const { status, vendorId } = await searchParams;
  const statusFilter = status && ["UNPAID", "PAID"].includes(status) ? (status as PaymentStatus) : undefined;

  const [invoices, vendors] = await Promise.all([
    prisma.invoiceSubmission.findMany({
      where: {
        ...(statusFilter ? { paymentStatus: statusFilter } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
      include: { vendor: true, lineItems: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendor.findMany({
      where: { accountType: { in: ["FREELANCER", "CONTRACT_FREELANCER"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const query = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { status, vendorId, ...overrides };
    if (next.status) params.set("status", next.status);
    if (next.vendorId) params.set("vendorId", next.vendorId);
    const qs = params.toString();
    return qs ? `/admin/invoices?${qs}` : "/admin/invoices";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">All Invoices</h1>
        <div className="flex gap-1 rounded-[11px] bg-black/30 p-1 text-sm">
          {["ALL", "UNPAID", "PAID"].map((s) => (
            <Link
              key={s}
              href={query({ status: s === "ALL" ? undefined : s })}
              className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold ${
                (s === "ALL" && !statusFilter) || statusFilter === s ? "bg-white/[0.08] text-[#ece9f5]" : "text-[#8781a0]"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#8781a0]">Vendor:</span>
        <div className="flex flex-wrap gap-1 rounded-[11px] bg-black/30 p-1 text-sm">
          <Link
            href={query({ vendorId: undefined })}
            className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold ${!vendorId ? "bg-white/[0.08] text-[#ece9f5]" : "text-[#8781a0]"}`}
          >
            All
          </Link>
          {vendors.map((v) => (
            <Link
              key={v.id}
              href={query({ vendorId: v.id })}
              className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold ${
                vendorId === v.id ? "bg-white/[0.08] text-[#ece9f5]" : "text-[#8781a0]"
              }`}
            >
              {vendorDisplayName(v)}
            </Link>
          ))}
        </div>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Entered By</th>
              <th>Total</th>
              <th>Payment</th>
              <th>PDF</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((s) => {
              const total = s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
              return (
                <tr key={s.id}>
                  <td className="font-mono-g6 font-medium">
                    {s.invoiceNumber}
                    {s.isRecurring ? <span className="ml-2 text-[10px] text-[#8781a0]">(auto)</span> : null}
                  </td>
                  <td>
                    <Link href={`/admin/vendors/${s.vendorId}`} className="text-[#9d84ff] hover:text-[#cabfff]">
                      {vendorDisplayName(s.vendor)}
                    </Link>
                  </td>
                  <td>{s.createdAt.toLocaleDateString()}</td>
                  <td>{s.source === "ADMIN" ? "G6 Admin" : "Vendor"}</td>
                  <td className="font-mono-g6">{total.toFixed(2)}</td>
                  <td>
                    <Badge variant={statusBadgeVariant(s.paymentStatus)}>{s.paymentStatus}</Badge>
                  </td>
                  <td>
                    <a href={`/api/invoices/${s.id}/pdf`} target="_blank" className="text-[#9d84ff] hover:text-[#cabfff]">
                      View
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
                    {s.paymentStatus === "UNPAID" ? (
                      <MarkInvoicePaidInline submissionId={s.id} vendorId={s.vendorId} defaultAmount={total} />
                    ) : (
                      <MarkInvoiceUnpaidButton submissionId={s.id} vendorId={s.vendorId} />
                    )}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5c5770]">
                  No invoices found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
