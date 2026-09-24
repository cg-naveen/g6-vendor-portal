"use client";

import { useActionState } from "react";
import { recordSalaryChange, type FormState } from "@/actions/staff";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";
import { formatDisplayDate } from "@/lib/billingDates";

const currencyFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type SalaryHistoryRecord = {
  id: string;
  effectiveFrom: string;
  monthlySalary: number;
  reason: string | null;
};

const initialState: FormState = {};

export function SalaryHistorySection({
  employeeId,
  records,
}: {
  employeeId: string;
  records: SalaryHistoryRecord[];
}) {
  const [state, formAction, pending] = useActionState(recordSalaryChange, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Effective From</th>
              <th>Monthly Salary</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{formatDisplayDate(new Date(record.effectiveFrom))}</td>
                <td className="font-mono-g6">{currencyFormat.format(record.monthlySalary)}</td>
                <td>{record.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[#8781a0]">
        Salary records are append-only. A correction is a new record; increments effective in a month that has already
        been finalized are paid as a back-pay arrears line on the current payslip.
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="employeeId" value={employeeId} />
        {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
        {state.success ? <SuccessBanner>Salary change recorded.</SuccessBanner> : null}
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
          <FormField
            label="Monthly Salary"
            name="monthlySalary"
            type="number"
            min="0.01"
            required
            error={errors.monthlySalary}
          />
          <FormField
            label="Effective From"
            name="effectiveFrom"
            type="date"
            required
            error={errors.effectiveFrom}
          />
          <FormField label="Reason" name="reason" error={errors.reason} />
        </div>
        <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
          {pending ? "Recording..." : "Record Increment"}
        </button>
      </form>
    </div>
  );
}
