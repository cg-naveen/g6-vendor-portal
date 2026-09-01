"use client";

import { useActionState, useMemo, useState } from "react";
import { updateAutoBilling, type FormState } from "@/actions/admin";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { upcomingBillingDates } from "@/lib/billingDates";

const initialState: FormState = {};

export function AutoBillingForm({
  vendorId,
  autoBillingEnabled,
  recurringDescription,
  recurringAmount,
  billingDayOfMonth,
  nextBillingDate,
  lastBilledAt,
}: {
  vendorId: string;
  autoBillingEnabled: boolean;
  recurringDescription: string;
  recurringAmount: number | null;
  billingDayOfMonth: number | null;
  nextBillingDate: string | null;
  lastBilledAt: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateAutoBilling, initialState);
  const [enabled, setEnabled] = useState(autoBillingEnabled);

  const defaultDate = nextBillingDate ? new Date(nextBillingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const defaultBillingDay = billingDayOfMonth ?? (nextBillingDate ? new Date(nextBillingDate).getUTCDate() : 1);

  const upcomingDates = useMemo(() => {
    if (!nextBillingDate) return [];
    return upcomingBillingDates(new Date(nextBillingDate), defaultBillingDay, 6).map((date) =>
      date.toLocaleDateString("en-GB", { timeZone: "UTC" })
    );
  }, [nextBillingDate, defaultBillingDay]);

  return (
    <section className="g6-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="g6-section-label">Auto-Billing (Monthly)</h2>
        {lastBilledAt ? <span className="text-xs text-[#8781a0]">Last billed {new Date(lastBilledAt).toLocaleDateString()}</span> : null}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="vendorId" value={vendorId} />

        {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
        {state.success ? (
          <SuccessBanner>
            Auto-billing settings saved. Due invoice batches were generated automatically if any billing dates had passed.
          </SuccessBanner>
        ) : null}

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
          <span className="g6-label">Recurring Description / Deliverables</span>
          <input
            name="recurringDescription"
            type="text"
            defaultValue={recurringDescription}
            placeholder="e.g. Contract Digital Marketing Executive"
            className="g6-input"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <span className="g6-label">Billing Day of Month</span>
            <input
              name="billingDayOfMonth"
              type="number"
              min="1"
              max="31"
              defaultValue={defaultBillingDay}
              className="g6-input"
            />
          </label>
          <label className="block">
            <span className="g6-label">First / Next Billing Date</span>
            <input name="nextBillingDate" type="date" defaultValue={defaultDate} className="g6-input" />
          </label>
        </div>

        {upcomingDates.length > 0 ? (
          <div className="rounded-xl border border-[#2a2540] bg-[#0d0b14] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[#5c5770]">Upcoming billing batches</p>
            <p className="mt-2 text-sm text-[#dcd8ea]">{upcomingDates.join(" · ")}</p>
          </div>
        ) : null}

        <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
          {pending ? "Saving..." : "Save Auto-Billing Settings"}
        </button>
      </form>
    </section>
  );
}
