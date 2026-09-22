"use client";

import { useActionState, useState } from "react";
import {
  deleteDraftRunAction,
  refreshDraftRunAction,
  type FormState,
} from "@/actions/payroll";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function RefreshDraftRunForm({ runId }: { runId: string }) {
  const [state, formAction, pending] = useActionState(refreshDraftRunAction, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="runId" value={runId} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success && state.message ? <SuccessBanner>{state.message}</SuccessBanner> : null}
      <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary g6-btn-sm">
        {pending ? "Refreshing..." : "Refresh payslips from staff list"}
      </button>
      <p className="text-[11px] text-[#8781a0]">
        Re-runs generation for this month. Picks up new staff and salary changes; keeps PCB and
        hand-edited lines on existing payslips.
      </p>
    </form>
  );
}

export function DeleteDraftRunForm({ runId, periodLabel }: { runId: string; periodLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteDraftRunAction, initialState);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="g6-btn g6-btn-danger g6-btn-sm">
        Delete draft run
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            action={formAction}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[color-mix(in_srgb,#ff9494_35%,transparent)] bg-[#100e18] p-6 shadow-2xl"
          >
            <input type="hidden" name="runId" value={runId} />
            {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
            <div>
              <p className="text-[15px] font-semibold text-[#ff9494]">Delete {periodLabel} draft?</p>
              <p className="mt-2 text-[13px] text-[#a09bb5]">
                This removes the draft run and every payslip in it. You can generate the month again
                from the Payroll list afterwards. Finalized runs cannot be deleted.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={pending} className="g6-btn g6-btn-danger g6-btn-sm">
                {pending ? "Deleting..." : "Confirm delete"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="g6-btn g6-btn-secondary g6-btn-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
