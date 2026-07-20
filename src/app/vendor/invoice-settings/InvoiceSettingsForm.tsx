"use client";

import { useActionState, useState } from "react";
import { updateInvoiceSettings, type FormState } from "@/actions/invoiceSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import type { InvoiceTemplate } from "@prisma/client";

const TEMPLATES: { id: InvoiceTemplate; name: string; description: string; accent: string }[] = [
  { id: "CLASSIC", name: "Classic", description: "Black header bar with a boxed invoice number and payment details panel.", accent: "#18181b" },
  { id: "MODERN", name: "Modern", description: "Navy corporate layout with Service Details and a dark payment info bar.", accent: "#0f172a" },
  { id: "MINIMAL", name: "Minimal", description: "Plain, whitespace-driven layout with a simple line-item table.", accent: "#71717a" },
  { id: "BOLD", name: "Bold", description: "Yellow-and-black banner with a numbered line-item table and signature line.", accent: "#f5c518" },
];

const initialState: FormState = {};

export function InvoiceSettingsForm({
  currentTemplate,
  currentWatermark,
  currentFooter,
  hasLogo,
}: {
  currentTemplate: InvoiceTemplate;
  currentWatermark: string;
  currentFooter: string;
  hasLogo: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateInvoiceSettings, initialState);
  const [template, setTemplate] = useState<InvoiceTemplate>(currentTemplate);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="invoiceTemplate" value={template} />

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Settings saved.</SuccessBanner> : null}

      <div>
        <span className="g6-label mb-3">Invoice Template</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`rounded-xl border p-4 text-left transition ${
                template === t.id ? "border-[#7c5cff] ring-2 ring-[#7c5cff]/30" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="mb-3 h-16 rounded-md" style={{ backgroundColor: t.accent }} />
              <p className="text-sm font-semibold text-[#ece9f5]">{t.name}</p>
              <p className="mt-1 text-xs text-[#8781a0]">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="g6-label">Logo {hasLogo ? "(currently set)" : ""}</span>
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic API-served image, next/image not needed here
          <img src="/api/vendor/logo" alt="Current logo" className="mb-2 h-16 rounded border border-white/10 bg-white/5 object-contain p-1" />
        ) : null}
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="block w-full rounded-[11px] border border-white/10 bg-black/30 text-sm text-[#a09bb5] file:mr-4 file:cursor-pointer file:rounded-[9px] file:border-0 file:bg-[#7c5cff]/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#cabfff] hover:file:bg-[#7c5cff]/30"
        />
        <p className="mt-1 text-xs text-[#5c5770]">Shown at the top of your generated invoices.</p>
      </div>

      <label className="block">
        <span className="g6-label">Watermark Text</span>
        <input name="watermarkText" type="text" defaultValue={currentWatermark} placeholder="e.g. ORIGINAL" maxLength={60} className="g6-input" />
      </label>

      <label className="block">
        <span className="g6-label">Footer Text</span>
        <textarea
          name="footerText"
          defaultValue={currentFooter}
          rows={2}
          maxLength={200}
          placeholder="e.g. Thank you for your business. Payment due within 30 days."
          className="g6-input"
        />
      </label>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
