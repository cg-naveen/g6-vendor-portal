"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminUpdateVendor, type FormState } from "@/actions/admin";
import { FormField } from "@/components/FormField";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

export type EditVendorFields = {
  id: string;
  type: "BUSINESS" | "INDIVIDUAL";
  vendorEmail: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  companyName: string | null;
  companyRegNumber: string | null;
  businessAddress: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  vendorName: string | null;
  homeAddress: string | null;
  bankName: string;
  accountNumber: string;
  ifsc: string | null;
  swift: string;
  bankAddress: string;
};

const initialState: FormState = {};

export function AdminEditVendorForm({ vendor }: { vendor: EditVendorFields }) {
  const [state, formAction, pending] = useActionState(adminUpdateVendor, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <input type="hidden" name="vendorId" value={vendor.id} />

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Vendor updated.</SuccessBanner> : null}

      {vendor.type === "BUSINESS" ? (
        <section className="space-y-4">
          <h2 className="g6-section-label">Company Details</h2>
          <FormField label="Company Name" name="companyName" required defaultValue={vendor.companyName ?? ""} error={errors.companyName} />
          <FormField label="Company Registration Number" name="companyRegNumber" defaultValue={vendor.companyRegNumber ?? ""} />
          <FormField label="Business Address" name="businessAddress" as="textarea" required defaultValue={vendor.businessAddress ?? ""} error={errors.businessAddress} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Contact Person Name" name="contactPersonName" defaultValue={vendor.contactPersonName ?? ""} />
            <FormField label="Contact Person Email" name="contactPersonEmail" type="email" defaultValue={vendor.contactPersonEmail ?? ""} />
            <FormField label="Contact Person Phone" name="contactPersonPhone" defaultValue={vendor.contactPersonPhone ?? ""} />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="g6-section-label">Individual Details</h2>
          <FormField label="Vendor Name" name="vendorName" required defaultValue={vendor.vendorName ?? ""} error={errors.vendorName} />
          <FormField label="Home Address" name="homeAddress" as="textarea" required defaultValue={vendor.homeAddress ?? ""} error={errors.homeAddress} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="g6-section-label">Contact</h2>
        <FormField label="Vendor Email" name="vendorEmail" type="email" required defaultValue={vendor.vendorEmail} error={errors.vendorEmail} />
        <p className="-mt-2 text-xs text-[#8781a0]">This is the billing/contact email shown on invoices. It does not change the vendor&apos;s login email.</p>
        <FormField label="Phone No" name="phone" required defaultValue={vendor.phone} error={errors.phone} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Country" name="country" required defaultValue={vendor.country} error={errors.country} />
          <FormField label="City" name="city" required defaultValue={vendor.city} error={errors.city} />
          <FormField label="State" name="state" required defaultValue={vendor.state} error={errors.state} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="g6-section-label">Bank Details</h2>
        <FormField label="Bank Name" name="bankName" required defaultValue={vendor.bankName} error={errors.bankName} />
        <FormField label="Account Number" name="accountNumber" required defaultValue={vendor.accountNumber} error={errors.accountNumber} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="IFSC" name="ifsc" defaultValue={vendor.ifsc ?? ""} />
          <FormField label="SWIFT" name="swift" required defaultValue={vendor.swift} error={errors.swift} />
        </div>
        <FormField label="Bank Address" name="bankAddress" as="textarea" required defaultValue={vendor.bankAddress} error={errors.bankAddress} />
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <Link href={`/admin/vendors/${vendor.id}`} className="g6-btn g6-btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
