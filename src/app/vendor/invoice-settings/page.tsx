import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { InvoiceSettingsForm } from "./InvoiceSettingsForm";
import { NextInvoiceNumberForm } from "./NextInvoiceNumberForm";

export default async function InvoiceSettingsPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER")) {
    redirect("/vendor");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="g6-page-title">Invoice Settings</h1>
      <div className="g6-card p-6">
        <InvoiceSettingsForm
          currentTemplate={vendor.invoiceTemplate}
          currentWatermark={vendor.watermarkText ?? ""}
          currentFooter={vendor.footerText ?? ""}
          hasLogo={Boolean(vendor.logoUrl)}
          hasSignature={Boolean(vendor.signatureUrl)}
        />
      </div>
      <div className="g6-card p-6">
        <h2 className="g6-section-label mb-3">Invoice Numbering</h2>
        <NextInvoiceNumberForm nextInvoiceNumber={vendor.invoiceSequence + 1} vendorCode={vendor.vendorCode} />
      </div>
    </div>
  );
}
