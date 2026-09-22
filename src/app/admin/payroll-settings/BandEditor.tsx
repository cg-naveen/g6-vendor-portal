"use client";

import { useActionState, useState, useTransition } from "react";
import {
  importBandsCsvAction,
  regenerateBandsAction,
  updateBandAction,
  verifyBandsAction,
  type FormState,
} from "@/actions/statutoryBands";
import { Badge } from "@/components/Badge";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

export type BandRow = {
  id: string;
  wageFrom: number;
  wageTo: number;
  employeeAmount: number;
  employerAmount: number;
  source: "GENERATED" | "MANUAL";
};

type BandEditorProps = {
  type: "SOCSO" | "EIS";
  bands: BandRow[];
  verifiedAt: Date | null;
  verifiedBy: string | null;
  generatedAt: Date | null;
};

const initialState: FormState = {};

function formatTimestamp(value: Date | null) {
  if (!value) return "an unknown date";
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(value);
}

function BandTableRow({ band }: { band: BandRow }) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<FormState>(initialState);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateBandAction(initialState, formData);
      setState(result);
      if (result.success) setEditing(false);
    });
  }

  return (
    <tr>
      <td className="font-mono-g6 whitespace-nowrap">
        {(band.wageFrom + 0.01).toFixed(2)} – {band.wageTo.toFixed(2)}
      </td>
      {editing ? (
        <>
          <td>
            <input
              form={`edit-band-${band.id}`}
              name="employeeAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={band.employeeAmount.toFixed(2)}
              className="g6-input w-28"
              aria-label="Employee amount"
              disabled={pending}
            />
          </td>
          <td>
            <input
              form={`edit-band-${band.id}`}
              name="employerAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={band.employerAmount.toFixed(2)}
              className="g6-input w-28"
              aria-label="Employer amount"
              disabled={pending}
            />
          </td>
        </>
      ) : (
        <>
          <td className="font-mono-g6">{band.employeeAmount.toFixed(2)}</td>
          <td className="font-mono-g6">{band.employerAmount.toFixed(2)}</td>
        </>
      )}
      <td>
        <Badge variant={band.source === "MANUAL" ? "paid" : "draft"}>{band.source}</Badge>
      </td>
      <td>
        <form id={`edit-band-${band.id}`} onSubmit={handleSubmit} className="flex items-center gap-2">
          <input type="hidden" name="id" value={band.id} />
          {editing ? (
            <>
              <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
                {pending ? "Saving..." : "Save"}
              </button>
              <button type="button" disabled={pending} onClick={() => setEditing(false)} className="g6-btn g6-btn-secondary">
                Cancel
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="g6-btn g6-btn-secondary">
              Edit
            </button>
          )}
        </form>
        {state.error ? <p className="mt-2 text-xs text-[#ff9f9f]">{state.error}</p> : null}
      </td>
    </tr>
  );
}

export function BandEditor({ type, bands, verifiedAt, verifiedBy, generatedAt }: BandEditorProps) {
  const [regenerateState, regenerateAction, regenerating] = useActionState(regenerateBandsAction, initialState);
  const [importState, importAction, importing] = useActionState(importBandsCsvAction, initialState);
  const [verifyState, verifyAction, verifying] = useActionState(verifyBandsAction, initialState);

  return (
    <div className="space-y-6">
      <div className={`g6-panel p-4 text-sm ${verifiedAt ? "text-[#5ee8c0]" : "text-[#f7c96e]"}`}>
        {verifiedAt
          ? `Verified by ${verifiedBy ?? "an administrator"} on ${formatTimestamp(verifiedAt)}.`
          : `Generated from the configured rates on ${formatTimestamp(generatedAt)}, not verified against the official PERKESO schedule.`}
      </div>

      <div className="g6-table-wrap overflow-x-auto">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Wage range</th>
              <th>Employee</th>
              <th>Employer</th>
              <th>Source</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((band) => (
              <BandTableRow key={band.id} band={band} />
            ))}
          </tbody>
        </table>
      </div>

      <section className="g6-card space-y-3 p-5">
        <div>
          <h2 className="text-base font-semibold text-[#ece9f5]">Regenerate from rates</h2>
          <p className="mt-1 text-sm text-[#8781a0]">
            Rebuilds every generated band from the configured rates. Manually edited bands are kept.
          </p>
        </div>
        <form action={regenerateAction}>
          <input type="hidden" name="type" value={type} />
          <button type="submit" disabled={regenerating} className="g6-btn g6-btn-secondary">
            {regenerating ? "Regenerating..." : "Regenerate from rates"}
          </button>
        </form>
        {regenerateState.error ? <ErrorBanner>{regenerateState.error}</ErrorBanner> : null}
        {regenerateState.success ? <SuccessBanner>{regenerateState.message}</SuccessBanner> : null}
      </section>

      <details className="g6-card p-5">
        <summary className="cursor-pointer text-base font-semibold text-[#ece9f5]">Import CSV</summary>
        <form action={importAction} className="mt-4 space-y-3">
          <input type="hidden" name="type" value={type} />
          <p className="text-sm text-[#8781a0]">
            Expected header: <code className="font-mono-g6 text-[#c4bfd5]">wageFrom,wageTo,employeeAmount,employerAmount</code>
          </p>
          <textarea
            name="csv"
            rows={8}
            className="g6-input min-h-44 w-full font-mono-g6"
            placeholder={"wageFrom,wageTo,employeeAmount,employerAmount\n0,100,0.25,0.85"}
            disabled={importing}
          />
          <button type="submit" disabled={importing} className="g6-btn g6-btn-danger">
            {importing ? "Importing..." : "Replace table with CSV"}
          </button>
          {importState.error ? <ErrorBanner>{importState.error}</ErrorBanner> : null}
          {importState.success ? <SuccessBanner>{importState.message}</SuccessBanner> : null}
        </form>
      </details>

      <section className="g6-card space-y-3 p-5">
        <h2 className="text-base font-semibold text-[#ece9f5]">Verification</h2>
        <form action={verifyAction} className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-[#c4bfd5]">
            <input
              name="confirmed"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]"
              disabled={verifying}
            />
            I have reconciled every band in both tables against the official PERKESO schedule.
          </label>
          <button type="submit" disabled={verifying} className="g6-btn g6-btn-primary">
            {verifying ? "Marking..." : "Mark as verified"}
          </button>
        </form>
        {verifyState.error ? <ErrorBanner>{verifyState.error}</ErrorBanner> : null}
        {verifyState.success ? <SuccessBanner>{verifyState.message}</SuccessBanner> : null}
      </section>
    </div>
  );
}
