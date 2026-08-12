"use client";

import { useActionState } from "react";
import { updateVendorProfile, type FormState } from "@/actions/profile";
import { FormField } from "@/components/FormField";
import { AddressFields } from "@/components/AddressFields";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

export type VendorProfileFields = {
  type: "BUSINESS" | "INDIVIDUAL";
  phone: string;
  country: string;
  city: string;
  state: string;
  businessAddress: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  homeAddressLine1: string | null;
  homeAddressLine2: string | null;
  homeCity: string | null;
  homePostcode: string | null;
  homeState: string | null;
  homeCountry: string | null;
  bankName: string;
  accountNumber: string;
  accountHolderName: string | null;
  ifsc: string | null;
  swift: string;
  bankAddressLine1: string | null;
  bankAddressLine2: string | null;
  bankCity: string | null;
  bankPostcode: string | null;
  bankState: string | null;
  bankCountry: string | null;
};

const initialState: FormState = {};

export function VendorProfileForm({ vendor }: { vendor: VendorProfileFields }) {
  const [state, formAction, pending] = useActionState(updateVendorProfile, initialState);

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Profile updated.</SuccessBanner> : null}

      <section className="space-y-4">
        <h2 className="g6-section-label">Contact Details</h2>
        <FormField label="Phone No" name="phone" required defaultValue={vendor.phone} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Country" name="country" required defaultValue={vendor.country} />
          <FormField label="City" name="city" required defaultValue={vendor.city} />
          <FormField label="State" name="state" required defaultValue={vendor.state} />
        </div>
      </section>

      {vendor.type === "BUSINESS" ? (
        <section className="space-y-4">
          <h2 className="g6-section-label">Business & Contact Person</h2>
          <FormField label="Business Address" name="businessAddress" as="textarea" defaultValue={vendor.businessAddress ?? ""} />
          <FormField label="Contact Person Name" name="contactPersonName" defaultValue={vendor.contactPersonName ?? ""} />
          <FormField label="Contact Person Email" name="contactPersonEmail" type="email" defaultValue={vendor.contactPersonEmail ?? ""} />
          <FormField label="Contact Person Phone" name="contactPersonPhone" defaultValue={vendor.contactPersonPhone ?? ""} />
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="g6-section-label">Address</h2>
          <h3 className="g6-label">Home Address</h3>
          <AddressFields
            prefix="home"
            required={false}
            defaultValues={{
              line1: vendor.homeAddressLine1,
              line2: vendor.homeAddressLine2,
              city: vendor.homeCity,
              postcode: vendor.homePostcode,
              state: vendor.homeState,
              country: vendor.homeCountry,
            }}
          />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="g6-section-label">Bank Details</h2>
        <FormField label="Bank Name" name="bankName" required defaultValue={vendor.bankName} />
        <FormField label="Account Holder Name" name="accountHolderName" required defaultValue={vendor.accountHolderName ?? ""} />
        <FormField label="Account Number" name="accountNumber" required defaultValue={vendor.accountNumber} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="IFSC" name="ifsc" defaultValue={vendor.ifsc ?? ""} />
          <FormField label="SWIFT" name="swift" required defaultValue={vendor.swift} />
        </div>
        <h3 className="g6-label">Bank Address</h3>
        <AddressFields
          prefix="bank"
          defaultValues={{
            line1: vendor.bankAddressLine1,
            line2: vendor.bankAddressLine2,
            city: vendor.bankCity,
            postcode: vendor.bankPostcode,
            state: vendor.bankState,
            country: vendor.bankCountry,
          }}
        />
      </section>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
