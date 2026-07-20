"use client";

import { useActionState, useState } from "react";
import { createVendorManually } from "@/actions/admin";
import type { FormState } from "@/actions/admin";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function AddVendorForm() {
  const [state, formAction, pending] = useActionState(createVendorManually, initialState);
  const [type, setType] = useState<"BUSINESS" | "INDIVIDUAL">("BUSINESS");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="type" value={type} />

      <div>
        <span className="g6-label mb-2">Vendor Type</span>
        <div className="flex gap-2">
          {(["BUSINESS", "INDIVIDUAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`g6-btn ${type === t ? "g6-btn-primary" : "g6-btn-secondary"}`}
            >
              {t === "BUSINESS" ? "Business" : "Individual"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="g6-label">Account Type</span>
        <select name="accountType" defaultValue="FREELANCER" className="g6-input g6-select">
          <option value="BUSINESS">Business</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="CONTRACT_FREELANCER">Contract Freelancer</option>
        </select>
        <p className="mt-1 text-xs text-[#5c5770]">This account will be created as already approved.</p>
      </div>

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      {type === "BUSINESS" ? (
        <section className="space-y-4">
          <h2 className="g6-section-label">Company Details</h2>
          <FormField label="Company Name" name="companyName" required error={errors.companyName} />
          <FormField label="Company Registration Number" name="companyRegNumber" error={errors.companyRegNumber} />
          <FormField label="Business Address" name="businessAddress" as="textarea" required error={errors.businessAddress} />
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="g6-section-label">Vendor Details</h2>
          <FormField label="Vendor Name" name="vendorName" required error={errors.vendorName} />
          <FormField label="Vendor Home Address" name="homeAddress" as="textarea" required error={errors.homeAddress} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="g6-section-label">Contact Details</h2>
        <FormField label="Vendor Email" name="vendorEmail" type="email" required error={errors.vendorEmail} />
        <FormField label="Phone No" name="phone" required error={errors.phone} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Country" name="country" required error={errors.country} />
          <FormField label="City" name="city" required error={errors.city} />
          <FormField label="State" name="state" required error={errors.state} />
        </div>
      </section>

      {type === "BUSINESS" ? (
        <section className="space-y-4">
          <h2 className="g6-section-label">Contact Person</h2>
          <FormField label="Contact Person Name" name="contactPersonName" required error={errors.contactPersonName} />
          <FormField label="Contact Person Email" name="contactPersonEmail" type="email" required error={errors.contactPersonEmail} />
          <FormField label="Contact Person Phone" name="contactPersonPhone" required error={errors.contactPersonPhone} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="g6-section-label">Bank Details</h2>
        <FormField label="Bank Name" name="bankName" required error={errors.bankName} />
        <FormField label="Account Number" name="accountNumber" required error={errors.accountNumber} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="IFSC" name="ifsc" error={errors.ifsc} />
          <FormField label="SWIFT" name="swift" required error={errors.swift} />
        </div>
        <FormField label="Bank Address" name="bankAddress" as="textarea" required error={errors.bankAddress} />
      </section>

      <section className="space-y-4">
        <h2 className="g6-section-label">Initial Password</h2>
        <FormField
          label="Password"
          name="password"
          type="password"
          required
          error={errors.password}
          placeholder="At least 8 characters — share this with the vendor"
        />
      </section>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Creating..." : "Create Vendor Account"}
      </button>
    </form>
  );
}
