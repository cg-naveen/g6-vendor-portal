"use client";

import { useActionState, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";

export type TaskRow = {
  date: string;
  description: string;
  quantity: string;
  rate: string;
};

export function emptyTaskRow(): TaskRow {
  return { date: new Date().toISOString().slice(0, 10), description: "", quantity: "1", rate: "" };
}

type ActionState = { error?: string; success?: boolean };

export function TaskRowsEditor({
  action,
  hiddenFields,
  initialRows,
  initialNotes,
  submitLabel,
  pendingLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  hiddenFields?: Record<string, string>;
  initialRows?: TaskRow[];
  initialNotes?: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [rows, setRows] = useState<TaskRow[]>(initialRows && initialRows.length > 0 ? initialRows : [emptyTaskRow()]);
  const [notes, setNotes] = useState(initialNotes ?? "");

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.quantity) || 0) * (Number(r.rate) || 0), 0),
    [rows]
  );

  function updateRow(index: number, field: keyof TaskRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyTaskRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const cellInputClass = "g6-input py-1.5 text-sm";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <input type="hidden" name="notes" value={notes} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)
        : null}

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      <div className="g6-table-wrap overflow-x-auto">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Qty / Hours</th>
              <th>Rate</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(i, "date", e.target.value)}
                    required
                    className={`w-36 ${cellInputClass}`}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, "description", e.target.value)}
                    required
                    placeholder="Describe the deliverable"
                    className={`w-full min-w-[200px] ${cellInputClass}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, "quantity", e.target.value)}
                    required
                    className={`w-24 ${cellInputClass}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => updateRow(i, "rate", e.target.value)}
                    required
                    className={`w-28 ${cellInputClass}`}
                  />
                </td>
                <td className="font-mono-g6 text-right text-[#a09bb5]">
                  {((Number(row.quantity) || 0) * (Number(row.rate) || 0)).toFixed(2)}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-xs text-[#ff9494] hover:text-[#ffb3b3] disabled:opacity-40"
                    disabled={rows.length === 1}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addRow} className="g6-btn g6-btn-secondary">
        + Add Row
      </button>

      <div className="flex justify-end font-mono-g6 text-lg font-semibold text-[#ece9f5]">Total: {total.toFixed(2)}</div>

      <label className="block">
        <span className="g6-label">Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="g6-input" />
      </label>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
