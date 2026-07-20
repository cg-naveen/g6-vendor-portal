"use client";

import { useActionState } from "react";
import { createBill, type FormState } from "@/actions/bills";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

export function NewBillForm() {
  const [state, formAction, pending] = useActionState(createBill, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p> : null}
      <FormField label="Amount" name="amount" type="number" required error={errors.amount} placeholder="0.00" />
      <FormField label="Description" name="description" as="textarea" error={errors.description} placeholder="What is this bill for?" />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Invoice File <span className="text-red-500">*</span>
        </span>
        <input
          name="invoiceFile"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg"
          className="block w-full rounded-md border border-zinc-300 text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {errors.invoiceFile ? <span className="mt-1 block text-xs text-red-500">{errors.invoiceFile}</span> : null}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit Bill"}
      </button>
    </form>
  );
}
