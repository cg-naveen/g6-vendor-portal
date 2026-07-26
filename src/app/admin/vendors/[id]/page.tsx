import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { updateBillStatus } from "@/actions/bills";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import { MarkBillPaidForm, MarkInvoicePaidForm } from "./MarkPaidForms";
import { AutoBillingForm } from "./AutoBillingForm";
import { ContractInfoForm } from "./ContractInfoForm";
import { VendorStatusActions } from "./VendorStatusActions";

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="g6-page-title">{vendorDisplayName(vendor)}</h1>
          <p className="g6-page-subtitle mt-1">{vendor.type === "BUSINESS" ? "Business Vendor" : "Individual Vendor"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/vendors/${vendor.id}/edit`} className="g6-btn g6-btn-secondary g6-btn-sm">
            Edit Vendor
          </Link>
          <Badge variant={statusBadgeVariant(vendor.status)}>{vendor.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="g6-card p-6">
            <h2 className="g6-section-label mb-4">Vendor Details</h2>
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

          <section className="g6-card p-6">
            <h2 className="g6-section-label mb-4">Bank Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
              <Detail label="Bank Name" value={vendor.bankName} />
              <Detail label="Account Number" value={vendor.accountNumber} />
              <Detail label="IFSC" value={vendor.ifsc} />
              <Detail label="SWIFT" value={vendor.swift} />
              <Detail label="Bank Address" value={vendor.bankAddress} full />
            </dl>
          </section>

          {vendor.accountType === "CONTRACT_FREELANCER" ? (
            <section className="g6-card p-6">
              <h2 className="g6-section-label mb-4">Contract Information</h2>
              <ContractInfoForm vendorId={vendor.id} initialHtml={vendor.contractInfo ?? ""} />
            </section>
          ) : null}

          {vendor.accountType === "CONTRACT_FREELANCER" ? (
            <AutoBillingForm
              vendorId={vendor.id}
              autoBillingEnabled={vendor.autoBillingEnabled}
              recurringDescription={vendor.recurringDescription ?? ""}
              recurringAmount={vendor.recurringAmount ? Number(vendor.recurringAmount) : null}
              nextBillingDate={vendor.nextBillingDate ? vendor.nextBillingDate.toISOString() : null}
              lastBilledAt={vendor.lastBilledAt ? vendor.lastBilledAt.toISOString() : null}
            />
          ) : null}

          {vendor.accountType === "BUSINESS" ? (
            <section className="g6-card p-6">
              <h2 className="g6-section-label mb-4">Submitted Bills</h2>
              <div className="overflow-x-auto">
              <table className="g6-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>File</th>
                    <th />
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
                      <td>
                        <div className="flex flex-col items-start gap-1.5">
                          {bill.status === "SUBMITTED" ? (
                            <div className="flex gap-3">
                              <form action={updateBillStatus.bind(null, bill.id, "APPROVED")}>
                                <button type="submit" className="text-xs text-[#5ee8c0] hover:underline">
                                  Approve
                                </button>
                              </form>
                              <form action={updateBillStatus.bind(null, bill.id, "REJECTED")}>
                                <button type="submit" className="text-xs text-[#ff9494] hover:underline">
                                  Reject
                                </button>
                              </form>
                            </div>
                          ) : null}
                          {bill.status === "APPROVED" && bill.paymentStatus === "UNPAID" ? (
                            <MarkBillPaidForm billId={bill.id} vendorId={vendor.id} defaultAmount={Number(bill.amount)} />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#5c5770]">
                        No bills submitted yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              </div>
            </section>
          ) : null}

          {vendor.accountType === "FREELANCER" || vendor.accountType === "CONTRACT_FREELANCER" ? (
            <section className="g6-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="g6-section-label">Invoices</h2>
                {vendor.accountType === "CONTRACT_FREELANCER" ? (
                  <Link href={`/admin/vendors/${vendor.id}/deliverables/new`} className="text-sm text-[#9d84ff] hover:text-[#cabfff]">
                    + Add Deliverable Entry
                  </Link>
                ) : null}
              </div>
              <div className="overflow-x-auto">
              <table className="g6-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Entered By</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>PDF</th>
                    <th />
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
                          <div className="flex flex-col items-start gap-1.5">
                            {vendor.accountType === "CONTRACT_FREELANCER" ? (
                              <Link href={`/admin/vendors/${vendor.id}/deliverables/${s.id}/edit`} className="text-xs text-[#9d84ff] hover:underline">
                                Edit
                              </Link>
                            ) : null}
                            {s.paymentStatus === "UNPAID" ? (
                              <MarkInvoicePaidForm submissionId={s.id} vendorId={vendor.id} defaultAmount={total} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#5c5770]">
                        No invoices yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <VendorStatusActions vendorId={vendor.id} status={vendor.status} currentAccountType={vendor.accountType} />
          {vendor.status === "REJECTED" && vendor.rejectionReason ? (
            <div className="g6-alert g6-alert-error">
              <strong>Rejection reason:</strong> {vendor.rejectionReason}
            </div>
          ) : null}
          {vendor.status === "BLOCKED" ? (
            <div className="g6-alert g6-alert-error">This vendor is blocked and cannot access the portal.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase text-[#5c5770]">{label}</dt>
      <dd className="text-[#dcd8ea]">{value || "—"}</dd>
    </div>
  );
}
