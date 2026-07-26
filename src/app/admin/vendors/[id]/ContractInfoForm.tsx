"use client";

import { useActionState } from "react";
import { updateContractInfo, type FormState } from "@/actions/admin";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function ContractInfoForm({ vendorId, initialHtml }: { vendorId: string; initialHtml: string }) {
  const [state, formAction, pending] = useActionState(updateContractInfo, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="vendorId" value={vendorId} />

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Contract information saved.</SuccessBanner> : null}

      <RichTextEditor
        name="contractInfo"
        defaultValue={initialHtml}
        placeholder="Scope of work, deliverables, contract term, rates, special terms…"
      />

      <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
        {pending ? "Saving..." : "Save Contract Information"}
      </button>
    </form>
  );
}
