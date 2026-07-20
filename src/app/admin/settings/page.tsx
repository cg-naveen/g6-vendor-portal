import { getOrgSettings } from "@/lib/orgSettings";
import { OrgSettingsForm } from "./OrgSettingsForm";

export default async function BillingSettingsPage() {
  const settings = await getOrgSettings();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="g6-page-title mb-1">Billing Settings</h1>
      <p className="g6-page-subtitle mb-6">This information appears as the &quot;Bill To&quot; details on Freelancer and Contract Freelancer invoices.</p>
      <div className="g6-card p-6">
        <OrgSettingsForm
          companyName={settings.companyName}
          address={settings.address ?? ""}
          taxId={settings.taxId ?? ""}
          email={settings.email ?? ""}
          phone={settings.phone ?? ""}
        />
      </div>
    </div>
  );
}
