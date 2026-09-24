"use client";

import { useActionState, useState } from "react";
import { markRunPaidAction, type FormState } from "@/actions/payroll";

const initialState: FormState = {};

export function MarkRunPaidForm({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markRunPaidAction, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="g6-btn g6-btn-secondary g6-btn-sm">
        Mark Run as Paid
      </button>
    );
  }

  return (
    <form action={formAction} className="g6-panel space-y-4 p-4">
      <input type="hidden" name="runId" value={runId} />
      {state.error ? <p className="text-[12px] text-[#ff9494]">{state.error}</p> : null}
      <label className="block">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#8781a0]">
          Payment date
        </span>
        <input
          name="paidAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
          className="g6-input py-1.5 text-xs"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#8781a0]">
          Reference
        </span>
        <input
          name="paymentReference"
          type="text"
          placeholder="Bank transfer reference"
          className="g6-input py-1.5 text-xs"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="g6-btn g6-btn-primary g6-btn-sm">
          {pending ? "Saving..." : "Confirm"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="g6-btn g6-btn-ghost g6-btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
