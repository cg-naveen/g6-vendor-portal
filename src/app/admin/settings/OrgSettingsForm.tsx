"use client";

import { useActionState } from "react";
import { updateOrgSettings, type FormState } from "@/actions/orgSettings";
import { FormField } from "@/components/FormField";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function OrgSettingsForm({
  companyName,
  address,
  taxId,
  email,
  phone,
}: {
  companyName: string;
  address: string;
  taxId: string;
  email: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState(updateOrgSettings, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Billing settings saved.</SuccessBanner> : null}

      <FormField label="Company Name" name="companyName" required defaultValue={companyName} />
      <FormField label="Billing Address" name="address" as="textarea" defaultValue={address} placeholder="Used as the Bill To address on invoices" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tax ID" name="taxId" defaultValue={taxId} />
        <FormField label="Contact Email" name="email" type="email" defaultValue={email} />
      </div>
      <FormField label="Contact Phone" name="phone" defaultValue={phone} />

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Billing Settings"}
      </button>
    </form>
  );
}
