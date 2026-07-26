import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { InvoiceSettingsForm } from "./InvoiceSettingsForm";

export default async function InvoiceSettingsPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER")) {
    redirect("/vendor");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="g6-page-title mb-6">Invoice Settings</h1>
      <div className="g6-card p-6">
        <InvoiceSettingsForm
          currentTemplate={vendor.invoiceTemplate}
          currentWatermark={vendor.watermarkText ?? ""}
          currentFooter={vendor.footerText ?? ""}
          hasLogo={Boolean(vendor.logoUrl)}
        />
      </div>
    </div>
  );
}
