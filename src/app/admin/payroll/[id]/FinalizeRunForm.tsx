"use client";

import { useActionState } from "react";
import { finalizeRunAction, type PayrollFormState } from "@/actions/payroll";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: PayrollFormState = {};

export function FinalizeRunForm({ runId, bandsVerified }: { runId: string; bandsVerified: boolean }) {
  const [state, formAction, pending] = useActionState(finalizeRunAction, initialState);

  return (
    <form action={formAction} className="g6-card space-y-4 p-6">
      <input type="hidden" name="runId" value={runId} />
      <div>
        <h2 className="g6-section-label">Finalize this run</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#a09bb5]">
          Finalizing locks every payslip in this run, records the rates used, and renders the PDFs. Locked payslips
          cannot be edited — a later correction is made as an adjustment line on a future payslip.
        </p>
      </div>

      <label className="flex max-w-3xl items-start gap-3 text-sm text-[#dcd8ea]">
        <input name="acknowledged" type="checkbox" required className="mt-1" />
        <span>
          {bandsVerified
            ? "I have reviewed every payslip in this run."
            : "I understand the SOCSO and EIS tables have not been reconciled against the official PERKESO schedule."}
        </span>
      </label>

      {state.error && !state.issues ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.issues ? (
        <div className="g6-panel p-4">
          <h3 className="text-sm font-semibold text-[#dcd8ea]">Fix these before finalizing</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {state.issues.map((issue, index) => (
              <li key={`${issue.payslipId}-${index}`}>
                <span className="font-semibold">{issue.employeeName}</span>:{" "}
                <span className="text-[#ff9494]">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state.success && state.message ? <SuccessBanner>{state.message}</SuccessBanner> : null}

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Finalizing..." : "Finalize & Issue Payslips"}
      </button>
    </form>
  );
}
