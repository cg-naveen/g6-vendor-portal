"use client";

import { useActionState } from "react";
import { staffUpdateProfile, type FormState } from "@/actions/staff";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";

export type StaffProfileFields = {
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  state: string | null;
  country: string | null;
  bankName: string;
  accountNumber: string;
  accountHolderName: string | null;
};

const initialState: FormState = {};

export function StaffProfileForm({ employee }: { employee: StaffProfileFields }) {
  const [formState, formAction, pending] = useActionState(staffUpdateProfile, initialState);
  const errors = formState.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      {formState.error ? <ErrorBanner>{formState.error}</ErrorBanner> : null}
      {formState.success ? <SuccessBanner>Profile updated.</SuccessBanner> : null}

      <section className="space-y-4">
        <h2 className="g6-section-label">Contact details</h2>
        <FormField
          label="Phone"
          name="phone"
          required
          defaultValue={employee.phone}
          error={errors.phone}
        />
      </section>

      <section className="space-y-4">
        <h2 className="g6-section-label">Address</h2>
        <FormField
          label="Address Line 1"
          name="addressLine1"
          defaultValue={employee.addressLine1 ?? ""}
          error={errors.addressLine1}
        />
        <FormField
          label="Address Line 2 (optional)"
          name="addressLine2"
          defaultValue={employee.addressLine2 ?? ""}
          error={errors.addressLine2}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="City" name="city" defaultValue={employee.city ?? ""} error={errors.city} />
          <FormField
            label="Postcode"
            name="postcode"
            defaultValue={employee.postcode ?? ""}
            error={errors.postcode}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="State" name="state" defaultValue={employee.state ?? ""} error={errors.state} />
          <FormField
            label="Country"
            name="country"
            defaultValue={employee.country ?? ""}
            error={errors.country}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="g6-section-label">Bank details</h2>
        <FormField
          label="Bank Name"
          name="bankName"
          required
          defaultValue={employee.bankName}
          error={errors.bankName}
        />
        <FormField
          label="Account Holder Name"
          name="accountHolderName"
          defaultValue={employee.accountHolderName ?? ""}
          error={errors.accountHolderName}
        />
        <FormField
          label="Account Number"
          name="accountNumber"
          required
          defaultValue={employee.accountNumber}
          error={errors.accountNumber}
        />
      </section>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
