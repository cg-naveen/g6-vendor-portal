"use client";

import { useActionState } from "react";
import { createBill, type FormState } from "@/actions/bills";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function NewBillForm() {
  const [state, formAction, pending] = useActionState(createBill, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      <FormField label="Amount" name="amount" type="number" required error={errors.amount} placeholder="0.00" />
      <FormField label="Description" name="description" as="textarea" error={errors.description} placeholder="What is this bill for?" />
      <label className="block">
        <span className="g6-label">
          Invoice File <span className="text-[#ff9494]">*</span>
        </span>
        <input
          name="invoiceFile"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg"
          className="block w-full rounded-[11px] border border-white/10 bg-black/30 text-sm text-[#a09bb5] file:mr-4 file:cursor-pointer file:rounded-[9px] file:border-0 file:bg-[#7c5cff]/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#cabfff] hover:file:bg-[#7c5cff]/30"
        />
        {errors.invoiceFile ? <span className="g6-help-error">{errors.invoiceFile}</span> : null}
      </label>
      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Submitting..." : "Submit Bill"}
      </button>
    </form>
  );
}
