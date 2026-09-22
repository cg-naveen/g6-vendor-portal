"use client";

import { useActionState } from "react";
import { regeneratePdfsAction, type FormState } from "@/actions/payroll";

const initialState: FormState = {};

export function RegeneratePdfsButton({ runId, missing }: { runId: string; missing: number }) {
  const [state, formAction, pending] = useActionState(regeneratePdfsAction, initialState);

  return (
    <div className="g6-panel flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-[#f7c96e]">
          {missing} {missing === 1 ? "payslip has" : "payslips have"} no PDF.
        </p>
        {state.message ? <p className="mt-1 text-xs text-[#a09bb5]">{state.message}</p> : null}
        {state.error ? <p className="mt-1 text-xs text-[#ff9494]">{state.error}</p> : null}
      </div>
      <form action={formAction}>
        <input type="hidden" name="runId" value={runId} />
        <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
          {pending ? "Regenerating..." : "Regenerate missing PDFs"}
        </button>
      </form>
    </div>
  );
}
