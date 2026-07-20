"use client";

import { useActionState, useMemo, useState } from "react";

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

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="rows" value={JSON.stringify(rows)} />
      <input type="hidden" name="notes" value={notes} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)
        : null}

      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Qty / Hours</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="px-3 py-2">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(i, "date", e.target.value)}
                    required
                    className="w-36 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(i, "description", e.target.value)}
                    required
                    placeholder="Describe the deliverable"
                    className="w-full min-w-[200px] rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, "quantity", e.target.value)}
                    required
                    className="w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => updateRow(i, "rate", e.target.value)}
                    required
                    className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-right text-zinc-600">
                  {((Number(row.quantity) || 0) * (Number(row.rate) || 0)).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-xs text-red-500 hover:underline"
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

      <button type="button" onClick={addRow} className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
        + Add Row
      </button>

      <div className="flex justify-end text-lg font-semibold text-zinc-900">Total: {total.toFixed(2)}</div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
