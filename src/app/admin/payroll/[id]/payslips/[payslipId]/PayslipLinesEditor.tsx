"use client";

import { useActionState, useMemo, useState } from "react";
import { updatePayslipLinesAction } from "@/actions/payroll";
import { ErrorBanner } from "@/components/ErrorBanner";

export type PayslipLineRow = {
  kind: "EARNING" | "WAGE_DEDUCTION" | "NET_DEDUCTION";
  label: string;
  units: string;
  rate: string;
  amount: string;
  taxable: boolean;
  epfApplicable: boolean;
  socsoApplicable: boolean;
};

export function emptyPayslipLineRow(): PayslipLineRow {
  return {
    kind: "EARNING",
    label: "",
    units: "",
    rate: "",
    amount: "",
    taxable: true,
    epfApplicable: true,
    socsoApplicable: true,
  };
}

const KIND_OPTIONS: { value: PayslipLineRow["kind"]; label: string }[] = [
  { value: "EARNING", label: "Earning" },
  { value: "WAGE_DEDUCTION", label: "Wage deduction" },
  { value: "NET_DEDUCTION", label: "Net deduction" },
];

const NET_DEDUCTION_FLAG_TITLE =
  "Net deductions come out of pay after contributions, so they never affect a contribution base.";

export function PayslipLinesEditor({
  payslipId,
  initialRows,
  initialNotes,
}: {
  payslipId: string;
  initialRows: PayslipLineRow[];
  initialNotes: string;
}) {
  const [state, formAction, pending] = useActionState(updatePayslipLinesAction, {});
  const [rows, setRows] = useState<PayslipLineRow[]>(initialRows);
  const [notes, setNotes] = useState(initialNotes);

  const preview = useMemo(() => {
    let earnings = 0;
    let wageDeductions = 0;
    let netDeductions = 0;
    for (const row of rows) {
      const amount = Number(row.amount) || 0;
      if (row.kind === "EARNING") earnings += amount;
      else if (row.kind === "WAGE_DEDUCTION") wageDeductions += amount;
      else netDeductions += amount;
    }
    return { earnings, wageDeductions, netDeductions };
  }, [rows]);

  function updateRow(index: number, field: keyof PayslipLineRow, value: string | boolean) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        if (field === "kind" && value === "NET_DEDUCTION") {
          return { ...next, taxable: false, epfApplicable: false, socsoApplicable: false };
        }
        return next;
      })
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyPayslipLineRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const cellInputClass = "g6-input py-1.5 text-sm";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payslipId" value={payslipId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <input type="hidden" name="notes" value={notes} />

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      <div className="space-y-2 text-[11px] text-[#8781a0]">
        <p>
          <strong className="text-[#a09bb5]">Earning</strong> — adds to pay. Use for allowances, overtime, bonuses and
          back-pay arrears.
        </p>
        <p>
          <strong className="text-[#a09bb5]">Wage deduction</strong> — reduces pay <em>and</em> the EPF, SOCSO and tax
          bases. Use for unpaid leave.
        </p>
        <p>
          <strong className="text-[#a09bb5]">Net deduction</strong> — comes out of pay after contributions, leaving the
          bases untouched. Use for salary advances and staff loans.
        </p>
      </div>

      <div className="g6-table-wrap overflow-x-auto">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Label</th>
              <th>Units</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Taxable</th>
              <th>EPF</th>
              <th>SOCSO</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const flagsDisabled = row.kind === "NET_DEDUCTION";
              return (
                <tr key={i}>
                  <td>
                    <select
                      value={row.kind}
                      onChange={(e) => updateRow(i, "kind", e.target.value)}
                      className={`min-w-[140px] ${cellInputClass}`}
                    >
                      {KIND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(i, "label", e.target.value)}
                      required
                      className={`min-w-[160px] ${cellInputClass}`}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.units}
                      onChange={(e) => updateRow(i, "units", e.target.value)}
                      className={`w-20 ${cellInputClass}`}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.rate}
                      onChange={(e) => updateRow(i, "rate", e.target.value)}
                      className={`w-24 ${cellInputClass}`}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(i, "amount", e.target.value)}
                      required
                      className={`w-28 ${cellInputClass}`}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.taxable}
                      disabled={flagsDisabled}
                      title={flagsDisabled ? NET_DEDUCTION_FLAG_TITLE : undefined}
                      onChange={(e) => updateRow(i, "taxable", e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.epfApplicable}
                      disabled={flagsDisabled}
                      title={flagsDisabled ? NET_DEDUCTION_FLAG_TITLE : undefined}
                      onChange={(e) => updateRow(i, "epfApplicable", e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.socsoApplicable}
                      disabled={flagsDisabled}
                      title={flagsDisabled ? NET_DEDUCTION_FLAG_TITLE : undefined}
                      onChange={(e) => updateRow(i, "socsoApplicable", e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-xs text-[#ff9494] hover:text-[#ffb3b3]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6 text-center text-[#5c5770]">
                  No manual lines yet. Add an allowance, arrears, or deduction below.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="font-mono-g6 text-sm text-[#a09bb5]">
        Earnings +{preview.earnings.toFixed(2)} · Wage deductions -{preview.wageDeductions.toFixed(2)} · Net
        deductions -{preview.netDeductions.toFixed(2)}
      </p>

      <button type="button" onClick={addRow} className="g6-btn g6-btn-secondary">
        + Add Line
      </button>

      <label className="block">
        <span className="g6-label">Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="g6-input" />
      </label>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Saving..." : "Save Lines"}
      </button>
    </form>
  );
}
