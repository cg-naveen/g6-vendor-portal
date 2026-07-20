import Link from "next/link";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  BUSINESS: "Business",
  FREELANCER: "Freelancer",
  CONTRACT_FREELANCER: "Contract Freelancer",
};

export default async function VendorDashboard() {
  const vendor = await requireVendor();

  if (vendor.status === "PENDING") {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-amber-800">Registration Pending Review</h1>
        <p className="mt-2 text-sm text-amber-700">
          Thanks for registering, {vendorDisplayName(vendor)}. Our admin team is reviewing your application. You&apos;ll be able
          to submit bills or invoices once your account is approved.
        </p>
      </div>
    );
  }

  if (vendor.status === "REJECTED") {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-red-800">Registration Rejected</h1>
        <p className="mt-2 text-sm text-red-700">
          {vendor.rejectionReason || "Your registration was not approved. Please contact G6 Labs Asia for more details."}
        </p>
      </div>
    );
  }

  const [billCount, submissionCount] = await Promise.all([
    vendor.accountType === "BUSINESS" ? prisma.bill.count({ where: { vendorId: vendor.id } }) : Promise.resolve(0),
    vendor.accountType !== "BUSINESS" ? prisma.invoiceSubmission.count({ where: { vendorId: vendor.id } }) : Promise.resolve(0),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-lg font-semibold text-emerald-800">Welcome, {vendorDisplayName(vendor)}</h1>
        <p className="mt-1 text-sm text-emerald-700">
          Account type: <span className="font-semibold">{ACCOUNT_TYPE_LABEL[vendor.accountType ?? ""]}</span>
        </p>
      </div>

      {vendor.accountType === "BUSINESS" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold text-zinc-900">Bills</h2>
          <p className="mt-1 text-sm text-zinc-500">You have submitted {billCount} bill(s).</p>
          <Link href="/vendor/bills/new" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Upload New Bill
          </Link>
        </div>
      ) : null}

      {vendor.accountType === "FREELANCER" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold text-zinc-900">Task Entries</h2>
          <p className="mt-1 text-sm text-zinc-500">You have {submissionCount} submitted invoice(s).</p>
          <Link href="/vendor/tasks/new" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Submit Delivered Tasks
          </Link>
        </div>
      ) : null}

      {vendor.accountType === "CONTRACT_FREELANCER" ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold text-zinc-900">Invoices</h2>
          <p className="mt-1 text-sm text-zinc-500">
            G6 Labs Asia admin records your deliverables. You have {submissionCount} invoice(s) on file.
          </p>
          <Link href="/vendor/invoices" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            View Invoices
          </Link>
        </div>
      ) : null}
    </div>
  );
}
