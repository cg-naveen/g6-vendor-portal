"use client";

import { useActionState } from "react";
import { setPayslipPcbAction, type FormState } from "@/actions/payroll";

const initialState: FormState = {};

export function PcbInlineInput({ payslipId, value }: { payslipId: string; value: number | null }) {
  const [state, formAction, pending] = useActionState(setPayslipPcbAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="payslipId" value={payslipId} />
      <input
        name="pcb"
        type="number"
        step="0.01"
        min="0"
        defaultValue={value === null ? "" : Number(value).toFixed(2)}
        placeholder="Not set"
        disabled={pending}
        aria-invalid={value === null || Boolean(state.fieldErrors?.pcb)}
        aria-label="PCB amount"
        title={state.error}
        onBlur={(event) => event.currentTarget.form?.requestSubmit()}
        className={`g6-input w-24 py-1 text-xs ${value === null ? "g6-input-error" : ""}`}
      />
    </form>
  );
}
