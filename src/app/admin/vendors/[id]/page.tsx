import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { updateBillStatus } from "@/actions/bills";
import { ApproveForm, RejectForm } from "./ApproveRejectForms";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

  const [bills, submissions] = await Promise.all([
    vendor.accountType === "BUSINESS" ? prisma.bill.findMany({ where: { vendorId: vendor.id }, orderBy: { submittedAt: "desc" } }) : Promise.resolve([]),
    vendor.accountType && vendor.accountType !== "BUSINESS"
      ? prisma.invoiceSubmission.findMany({ where: { vendorId: vendor.id }, include: { lineItems: true }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{vendorDisplayName(vendor)}</h1>
          <p className="text-sm text-zinc-500">{vendor.type === "BUSINESS" ? "Business Vendor" : "Individual Vendor"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[vendor.status]}`}>{vendor.status}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Vendor Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              {vendor.type === "BUSINESS" ? (
                <>
                  <Detail label="Company Name" value={vendor.companyName} />
                  <Detail label="Registration Number" value={vendor.companyRegNumber} />
                  <Detail label="Business Address" value={vendor.businessAddress} full />
                  <Detail label="Contact Person" value={vendor.contactPersonName} />
                  <Detail label="Contact Email" value={vendor.contactPersonEmail} />
                  <Detail label="Contact Phone" value={vendor.contactPersonPhone} />
                </>
              ) : (
                <>
                  <Detail label="Vendor Name" value={vendor.vendorName} />
                  <Detail label="Home Address" value={vendor.homeAddress} full />
                </>
              )}
              <Detail label="Vendor Email" value={vendor.vendorEmail} />
              <Detail label="Phone" value={vendor.phone} />
              <Detail label="Country" value={vendor.country} />
              <Detail label="City" value={vendor.city} />
              <Detail label="State" value={vendor.state} />
              <Detail label="Registered" value={vendor.createdAt.toLocaleDateString()} />
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Bank Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              <Detail label="Bank Name" value={vendor.bankName} />
              <Detail label="Account Number" value={vendor.accountNumber} />
              <Detail label="IFSC" value={vendor.ifsc} />
              <Detail label="SWIFT" value={vendor.swift} />
              <Detail label="Bank Address" value={vendor.bankAddress} full />
            </dl>
          </section>

          {vendor.accountType === "BUSINESS" ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Submitted Bills</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">File</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-t border-zinc-100">
                      <td className="py-2">{bill.submittedAt.toLocaleDateString()}</td>
                      <td className="py-2">{bill.description || "—"}</td>
                      <td className="py-2">{Number(bill.amount).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[bill.status]}`}>{bill.status}</span>
                      </td>
                      <td className="py-2">
                        <a href={`/api/bills/${bill.id}/file`} className="text-indigo-600 hover:underline">
                          {bill.fileName}
                        </a>
                      </td>
                      <td className="py-2">
                        {bill.status === "SUBMITTED" ? (
                          <div className="flex gap-2">
                            <form action={updateBillStatus.bind(null, bill.id, "APPROVED")}>
                              <button type="submit" className="text-xs text-emerald-600 hover:underline">
                                Approve
                              </button>
                            </form>
                            <form action={updateBillStatus.bind(null, bill.id, "REJECTED")}>
                              <button type="submit" className="text-xs text-red-600 hover:underline">
                                Reject
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400">
                        No bills submitted yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          ) : null}

          {vendor.accountType === "FREELANCER" || vendor.accountType === "CONTRACT_FREELANCER" ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Invoices</h2>
                {vendor.accountType === "CONTRACT_FREELANCER" ? (
                  <Link href={`/admin/vendors/${vendor.id}/deliverables/new`} className="text-sm text-indigo-600 hover:underline">
                    + Add Deliverable Entry
                  </Link>
                ) : null}
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-2">Invoice #</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Entered By</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">PDF</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => {
                    const total = s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
                    return (
                      <tr key={s.id} className="border-t border-zinc-100">
                        <td className="py-2 font-medium">{s.invoiceNumber}</td>
                        <td className="py-2">{s.createdAt.toLocaleDateString()}</td>
                        <td className="py-2">{s.source === "ADMIN" ? "G6 Admin" : "Vendor"}</td>
                        <td className="py-2">{total.toFixed(2)}</td>
                        <td className="py-2">
                          <a href={`/api/invoices/${s.id}/pdf`} target="_blank" className="text-indigo-600 hover:underline">
                            View
                          </a>
                        </td>
                        <td className="py-2">
                          {vendor.accountType === "CONTRACT_FREELANCER" ? (
                            <Link href={`/admin/vendors/${vendor.id}/deliverables/${s.id}/edit`} className="text-xs text-indigo-600 hover:underline">
                              Edit
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-zinc-400">
                        No invoices yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <ApproveForm vendorId={vendor.id} currentAccountType={vendor.accountType} />
          <RejectForm vendorId={vendor.id} />
          {vendor.status === "REJECTED" && vendor.rejectionReason ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              <strong>Last rejection reason:</strong> {vendor.rejectionReason}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase text-zinc-400">{label}</dt>
      <dd className="text-zinc-800">{value || "—"}</dd>
    </div>
  );
}
