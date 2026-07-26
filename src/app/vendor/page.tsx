import Link from "next/link";
import { requireVendor } from "@/lib/currentUser";
import { vendorDisplayName } from "@/lib/invoice";
import { getVendorFinancialSummary, formatMoney } from "@/lib/stats";
import { isBlankHtml } from "@/lib/sanitize";
import { StatCard } from "@/components/StatCard";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  BUSINESS: "Business",
  FREELANCER: "Freelancer",
  CONTRACT_FREELANCER: "Contract Freelancer",
};

export default async function VendorDashboard() {
  const vendor = await requireVendor();

  if (vendor.status === "PENDING") {
    return (
      <div className="mx-auto max-w-xl g6-card p-8 text-center">
        <h1 className="g6-page-title">Registration Pending Review</h1>
        <p className="mt-3 text-sm text-[#a09bb5]">
          Thanks for registering, {vendorDisplayName(vendor)}. Our admin team is reviewing your application. You&apos;ll be able
          to submit bills or invoices once your account is approved.
        </p>
      </div>
    );
  }

  if (vendor.status === "REJECTED") {
    return (
      <div className="mx-auto max-w-xl g6-card p-8 text-center">
        <h1 className="g6-page-title text-[#ff9494]">Registration Rejected</h1>
        <p className="mt-3 text-sm text-[#a09bb5]">
          {vendor.rejectionReason || "Your registration was not approved. Please contact G6 Labs Asia for more details."}
        </p>
      </div>
    );
  }

  if (vendor.status === "BLOCKED") {
    return (
      <div className="mx-auto max-w-xl g6-card p-8 text-center">
        <h1 className="g6-page-title text-[#ff9494]">Account Blocked</h1>
        <p className="mt-3 text-sm text-[#a09bb5]">
          Your account access has been suspended. Please contact G6 Labs Asia to restore access.
        </p>
      </div>
    );
  }

  const summary = await getVendorFinancialSummary(vendor.id, vendor.accountType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="g6-page-title">Welcome back, {vendorDisplayName(vendor)}</h1>
        <p className="g6-page-subtitle mt-1">
          Account type: <span className="font-semibold text-[#cabfff]">{ACCOUNT_TYPE_LABEL[vendor.accountType ?? ""]}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatMoney(summary.outstanding)} hint={`${summary.outstandingCount} pending`} hintColor="pending" />
        <StatCard label="Paid" value={formatMoney(summary.paid)} hint={`${summary.paidCount} settled`} hintColor="paid" />
        <StatCard label="Total on file" value={String(summary.outstandingCount + summary.paidCount)} hint="invoices / bills" hintColor="muted" />
      </div>

      {vendor.accountType === "BUSINESS" ? (
        <div className="g6-card p-6">
          <h2 className="text-[15px] font-semibold text-[#ece9f5]">Bills</h2>
          <p className="mt-1 text-sm text-[#8781a0]">Upload a new invoice for G6 Labs Asia to review and pay.</p>
          <Link href="/vendor/bills/new" className="g6-btn g6-btn-primary mt-4">
            Upload New Bill
          </Link>
        </div>
      ) : null}

      {vendor.accountType === "FREELANCER" ? (
        <div className="g6-card p-6">
          <h2 className="text-[15px] font-semibold text-[#ece9f5]">Task Entries</h2>
          <p className="mt-1 text-sm text-[#8781a0]">Log delivered work and generate your invoice automatically.</p>
          <Link href="/vendor/tasks/new" className="g6-btn g6-btn-primary mt-4">
            Submit Delivered Tasks
          </Link>
        </div>
      ) : null}

      {vendor.accountType === "CONTRACT_FREELANCER" && !isBlankHtml(vendor.contractInfo) ? (
        <div className="g6-card p-6">
          <h2 className="text-[15px] font-semibold text-[#ece9f5]">Your Contract</h2>
          <div className="g6-prose mt-3 text-[#dcd8ea]" dangerouslySetInnerHTML={{ __html: vendor.contractInfo ?? "" }} />
        </div>
      ) : null}

      {vendor.accountType === "CONTRACT_FREELANCER" ? (
        <div className="g6-card p-6">
          <h2 className="text-[15px] font-semibold text-[#ece9f5]">Invoices</h2>
          <p className="mt-1 text-sm text-[#8781a0]">G6 Labs Asia admin records your deliverables and billing schedule.</p>
          <Link href="/vendor/invoices" className="g6-btn g6-btn-primary mt-4">
            View Invoices
          </Link>
        </div>
      ) : null}
    </div>
  );
}
