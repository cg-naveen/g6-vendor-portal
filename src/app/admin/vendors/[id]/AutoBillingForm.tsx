"use client";

import { useActionState, useState } from "react";
import { updateAutoBilling, type FormState } from "@/actions/admin";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function AutoBillingForm({
  vendorId,
  autoBillingEnabled,
  recurringDescription,
  recurringAmount,
  nextBillingDate,
  lastBilledAt,
}: {
  vendorId: string;
  autoBillingEnabled: boolean;
  recurringDescription: string;
  recurringAmount: number | null;
  nextBillingDate: string | null;
  lastBilledAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAutoBilling, initialState);
  const [enabled, setEnabled] = useState(autoBillingEnabled);

  const defaultDate = nextBillingDate ? new Date(nextBillingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <section className="g6-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="g6-section-label">Auto-Billing (Monthly)</h2>
        {lastBilledAt ? <span className="text-xs text-[#8781a0]">Last billed {new Date(lastBilledAt).toLocaleDateString()}</span> : null}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="vendorId" value={vendorId} />

        {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
        {state.success ? <SuccessBanner>Auto-billing settings saved.</SuccessBanner> : null}

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="autoBillingEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[#7c5cff]"
          />
          <span className="text-sm text-[#dcd8ea]">Enable monthly auto-invoicing for this vendor</span>
        </label>

        <label className="block">
          <span className="g6-label">Recurring Description</span>
          <input
            name="recurringDescription"
            type="text"
            defaultValue={recurringDescription}
            placeholder="e.g. Monthly retainer — contract services"
            className="g6-input"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="g6-label">Recurring Amount</span>
            <input
              name="recurringAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={recurringAmount !== null ? recurringAmount.toFixed(2) : ""}
              className="g6-input"
            />
          </label>
          <label className="block">
            <span className="g6-label">Next Billing Date</span>
            <input name="nextBillingDate" type="date" defaultValue={defaultDate} className="g6-input" />
          </label>
        </div>

        <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
          {pending ? "Saving..." : "Save Auto-Billing Settings"}
        </button>
      </form>
    </section>
  );
}
