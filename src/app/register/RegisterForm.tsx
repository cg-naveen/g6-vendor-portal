"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerVendor, type FormState } from "@/actions/auth";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerVendor, initialState);
  const [type, setType] = useState<"BUSINESS" | "INDIVIDUAL">("BUSINESS");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="type" value={type} />

      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700">Vendor Type</span>
        <div className="flex gap-2">
          {(["BUSINESS", "INDIVIDUAL"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium border ${
                type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-zinc-700 border-zinc-300"
              }`}
            >
              {t === "BUSINESS" ? "Business" : "Individual"}
            </button>
          ))}
        </div>
      </div>

      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p> : null}

      {type === "BUSINESS" ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Company Details</h2>
          <FormField label="Company Name" name="companyName" required error={errors.companyName} />
          <FormField label="Company Registration Number" name="companyRegNumber" error={errors.companyRegNumber} />
          <FormField label="Business Address" name="businessAddress" as="textarea" required error={errors.businessAddress} />
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Vendor Details</h2>
          <FormField label="Vendor Name" name="vendorName" required error={errors.vendorName} />
          <FormField label="Vendor Home Address" name="homeAddress" as="textarea" required error={errors.homeAddress} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Contact Details</h2>
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Contact Person</h2>
          <FormField label="Contact Person Name" name="contactPersonName" required error={errors.contactPersonName} />
          <FormField label="Contact Person Email" name="contactPersonEmail" type="email" required error={errors.contactPersonEmail} />
          <FormField label="Contact Person Phone" name="contactPersonPhone" required error={errors.contactPersonPhone} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Bank Details</h2>
        <FormField label="Bank Name" name="bankName" required error={errors.bankName} />
        <FormField label="Account Number" name="accountNumber" required error={errors.accountNumber} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="IFSC" name="ifsc" error={errors.ifsc} />
          <FormField label="SWIFT" name="swift" required error={errors.swift} />
        </div>
        <FormField label="Bank Address" name="bankAddress" as="textarea" required error={errors.bankAddress} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Account Password</h2>
        <FormField label="Password" name="password" type="password" required error={errors.password} placeholder="At least 8 characters" />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit Registration"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
