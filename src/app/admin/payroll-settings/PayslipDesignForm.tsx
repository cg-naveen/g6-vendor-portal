"use client";

import { useActionState, useState } from "react";
import { updatePayslipDesignAction, type FormState } from "@/actions/payrollSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function PayslipDesignForm({
  payslipLogoUrl,
  accentColor: initialAccentColor,
  showEmployerContributions,
  showHrdfColumn,
  showZakatColumn,
  epfFootnote,
  payslipFooterText,
}: {
  payslipLogoUrl: string | null;
  accentColor: string;
  showEmployerContributions: boolean;
  showHrdfColumn: boolean;
  showZakatColumn: boolean;
  epfFootnote: string;
  payslipFooterText: string;
}) {
  const [state, formAction, pending] = useActionState(updatePayslipDesignAction, initialState);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : initialAccentColor;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="accentColor" value={accentColor} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Payslip design saved.</SuccessBanner> : null}

      <div>
        <span className="g6-label">Payslip Logo {payslipLogoUrl ? "(currently set)" : ""}</span>
        {payslipLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- stored uploads may use local or remote URLs
          <img
            src={payslipLogoUrl}
            alt="Current payslip logo"
            className="mb-3 h-20 max-w-56 rounded border border-white/10 bg-white p-2 object-contain"
          />
        ) : null}
        <input
          name="payslipLogo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="block w-full rounded-[11px] border border-white/10 bg-black/30 text-sm text-[#a09bb5] file:mr-4 file:cursor-pointer file:rounded-[9px] file:border-0 file:bg-[#7c5cff]/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#cabfff] hover:file:bg-[#7c5cff]/30"
        />
      </div>

      <div>
        <span className="g6-label">Accent Colour</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={colorPickerValue}
            onChange={(event) => setAccentColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-black/30 p-1"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            maxLength={7}
            aria-label="Accent colour hex value"
            className="g6-input max-w-40 font-mono-g6"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="g6-label">Displayed Columns</legend>
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input name="showEmployerContributions" type="checkbox" defaultChecked={showEmployerContributions} className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]" />
          Show employer contributions
        </label>
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input name="showHrdfColumn" type="checkbox" defaultChecked={showHrdfColumn} className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]" />
          Show HRDF column
        </label>
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input name="showZakatColumn" type="checkbox" defaultChecked={showZakatColumn} className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]" />
          Show Zakat column
        </label>
      </fieldset>

      <label className="block">
        <span className="g6-label">EPF Footnote</span>
        <textarea name="epfFootnote" defaultValue={epfFootnote} rows={3} maxLength={300} className="g6-input" />
        <span className="mt-1 block text-xs text-[#5c5770]">
          Leave blank to generate it from the EPF rates actually used on each payslip.
        </span>
      </label>

      <label className="block">
        <span className="g6-label">Payslip Footer Text</span>
        <textarea name="payslipFooterText" defaultValue={payslipFooterText} rows={3} maxLength={300} className="g6-input" />
      </label>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Payslip Design"}
      </button>
    </form>
  );
}
