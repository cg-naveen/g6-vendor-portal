import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { InvoiceSettingsForm } from "./InvoiceSettingsForm";

export default async function InvoiceSettingsPage() {
  const vendor = await requireVendor();
  if (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER") {
    redirect("/vendor");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Invoice Settings</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
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
