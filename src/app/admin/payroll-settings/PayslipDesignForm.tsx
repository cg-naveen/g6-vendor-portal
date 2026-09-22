"use client";

import { useActionState, useState } from "react";
import { updatePayslipDesignAction, type FormState } from "@/actions/payrollSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function PayslipDesignForm({
  payslipLogoUrl,
  accentColor: initialAccentColor,
  showEmployerContributions: initialShowEmployerContributions,
  showHrdfColumn: initialShowHrdfColumn,
  showZakatColumn: initialShowZakatColumn,
  epfFootnote: initialEpfFootnote,
  payslipFooterText: initialPayslipFooterText,
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
  const [showEmployerContributions, setShowEmployerContributions] = useState(initialShowEmployerContributions);
  const [showHrdfColumn, setShowHrdfColumn] = useState(initialShowHrdfColumn);
  const [showZakatColumn, setShowZakatColumn] = useState(initialShowZakatColumn);
  const [epfFootnote, setEpfFootnote] = useState(initialEpfFootnote);
  const [payslipFooterText, setPayslipFooterText] = useState(initialPayslipFooterText);
  // Bump to force the preview iframe to reload with the latest field values.
  const [previewNonce, setPreviewNonce] = useState(0);

  const colorPickerValue = /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : initialAccentColor;

  function previewUrl(nonce: number) {
    const params = new URLSearchParams({
      accentColor,
      showEmployerContributions: showEmployerContributions ? "1" : "0",
      showHrdfColumn: showHrdfColumn ? "1" : "0",
      showZakatColumn: showZakatColumn ? "1" : "0",
      epfFootnote,
      payslipFooterText,
      n: String(nonce),
    });
    return `/api/admin/payslip-preview?${params.toString()}`;
  }

  const src = previewUrl(previewNonce);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="accentColor" value={accentColor} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Payslip design saved.</SuccessBanner> : null}

      {/* Inline live preview — mirrors vendor invoice settings */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="g6-label mb-0">Live Preview</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewNonce((n) => n + 1)}
              className="g6-btn g6-btn-secondary g6-btn-sm"
            >
              Refresh preview
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#9d84ff] hover:text-[#cabfff] hover:underline"
            >
              Open in new tab ↗
            </a>
          </div>
        </div>
        <iframe
          key={src}
          title="Payslip preview"
          src={src}
          className="h-[640px] w-full rounded-xl border border-white/10 bg-white"
        />
        <p className="mt-2 text-xs text-[#5c5770]">
          Sample employee and figures are used for the preview. Change the options below and click
          “Refresh preview” to see the update. Logo changes appear after you save.
        </p>
      </div>

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
        <p className="mt-1 text-xs text-[#5c5770]">
          Save settings first, then refresh the preview to see the logo on the sample payslip.
        </p>
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
          <input
            name="showEmployerContributions"
            type="checkbox"
            checked={showEmployerContributions}
            onChange={(event) => setShowEmployerContributions(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]"
          />
          Show employer contributions
        </label>
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input
            name="showHrdfColumn"
            type="checkbox"
            checked={showHrdfColumn}
            onChange={(event) => setShowHrdfColumn(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]"
          />
          Show HRDF column
        </label>
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input
            name="showZakatColumn"
            type="checkbox"
            checked={showZakatColumn}
            onChange={(event) => setShowZakatColumn(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]"
          />
          Show Zakat column
        </label>
      </fieldset>

      <label className="block">
        <span className="g6-label">EPF Footnote</span>
        <textarea
          name="epfFootnote"
          value={epfFootnote}
          onChange={(event) => setEpfFootnote(event.target.value)}
          rows={3}
          maxLength={300}
          className="g6-input"
        />
        <span className="mt-1 block text-xs text-[#5c5770]">
          Leave blank to generate it from the EPF rates actually used on each payslip.
        </span>
      </label>

      <label className="block">
        <span className="g6-label">Payslip Footer Text</span>
        <textarea
          name="payslipFooterText"
          value={payslipFooterText}
          onChange={(event) => setPayslipFooterText(event.target.value)}
          rows={3}
          maxLength={300}
          className="g6-input"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
          {pending ? "Saving..." : "Save Payslip Design"}
        </button>
        <button
          type="button"
          onClick={() => setPreviewNonce((n) => n + 1)}
          className="g6-btn g6-btn-secondary"
        >
          Refresh preview
        </button>
      </div>
    </form>
  );
}
