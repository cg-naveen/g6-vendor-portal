"use client";

import { useActionState, useState } from "react";
import { updateNextInvoiceNumber, type FormState } from "@/actions/invoiceSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { formatInvoiceNumber } from "@/lib/invoiceNumber";

const initialState: FormState = {};

export function NextInvoiceNumberForm({ nextInvoiceNumber, vendorCode }: { nextInvoiceNumber: number; vendorCode: string }) {
  const [state, formAction, pending] = useActionState(updateNextInvoiceNumber, initialState);
  const [preview, setPreview] = useState(nextInvoiceNumber);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Invoice numbering updated.</SuccessBanner> : null}

      <p className="text-xs text-[#8781a0]">
        Every invoice you generate uses the fixed prefix{" "}
        <span className="font-mono-g6">
          INV-{"{YY}"}-{vendorCode}-
        </span>
        , followed by a number that increments automatically. If you need to align with your own records, fix the next number below.
      </p>

      <label className="block">
        <span className="g6-label">Next Invoice Number</span>
        <input
          name="nextInvoiceNumber"
          type="number"
          min={1}
          step={1}
          value={preview}
          onChange={(e) => setPreview(Number(e.target.value) || 1)}
          className="g6-input"
        />
      </label>

      <p className="text-xs text-[#5c5770]">
        Your next invoice will be numbered <span className="font-mono-g6 text-[#cabfff]">{formatInvoiceNumber(preview, vendorCode)}</span>.
      </p>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary g6-btn-sm">
        {pending ? "Saving..." : "Save Numbering"}
      </button>
    </form>
  );
}
