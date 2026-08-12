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
  hasSignature,
}: {
  currentTemplate: InvoiceTemplate;
  currentWatermark: string;
  currentFooter: string;
  hasLogo: boolean;
  hasSignature: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateInvoiceSettings, initialState);
  const [template, setTemplate] = useState<InvoiceTemplate>(currentTemplate);
  const [watermarkText, setWatermarkText] = useState(currentWatermark);
  const [footerText, setFooterText] = useState(currentFooter);
  // Bump to force the preview iframe to reload with the latest field values.
  const [previewNonce, setPreviewNonce] = useState(0);

  function previewUrl(templateId: InvoiceTemplate, nonce: number) {
    const params = new URLSearchParams({ template: templateId, watermarkText, footerText, n: String(nonce) });
    return `/api/vendor/invoice-preview?${params.toString()}`;
  }

  function selectTemplate(id: InvoiceTemplate) {
    setTemplate(id);
    setPreviewNonce((n) => n + 1);
  }

  const src = previewUrl(template, previewNonce);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="invoiceTemplate" value={template} />

      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Settings saved.</SuccessBanner> : null}

      <div>
        <span className="g6-label mb-3">Invoice Template</span>
        <p className="mb-3 text-xs text-[#8781a0]">Pick a design — the live preview below shows a sample invoice with your details, logo, watermark, and footer.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTemplate(t.id)}
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

      {/* Inline live preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="g6-label mb-0">Live Preview — {TEMPLATES.find((t) => t.id === template)?.name}</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPreviewNonce((n) => n + 1)} className="g6-btn g6-btn-secondary g6-btn-sm">
              Refresh preview
            </button>
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#9d84ff] hover:text-[#cabfff] hover:underline">
              Open in new tab ↗
            </a>
          </div>
        </div>
        <iframe
          key={src}
          title="Invoice preview"
          src={src}
          className="h-[640px] w-full rounded-xl border border-white/10 bg-white"
        />
        <p className="mt-2 text-xs text-[#5c5770]">
          Sample data is used for the preview. Edit the watermark or footer below and click “Refresh preview” to see the change.
          {hasLogo ? "" : " Upload a logo below to include it on your invoices."}
        </p>
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
        <p className="mt-1 text-xs text-[#5c5770]">Shown at the top of your generated invoices. Save settings first, then refresh the preview to see it.</p>
      </div>

      <div>
        <span className="g6-label">Signature {hasSignature ? "(currently set)" : ""}</span>
        {hasSignature ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic API-served image, next/image not needed here
          <img src="/api/vendor/signature" alt="Current signature" className="mb-2 h-16 rounded border border-white/10 bg-white/5 object-contain p-1" />
        ) : null}
        <input
          name="signature"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="block w-full rounded-[11px] border border-white/10 bg-black/30 text-sm text-[#a09bb5] file:mr-4 file:cursor-pointer file:rounded-[9px] file:border-0 file:bg-[#7c5cff]/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#cabfff] hover:file:bg-[#7c5cff]/30"
        />
        <p className="mt-1 text-xs text-[#5c5770]">A photo or scan of your signature, shown in the signature area of your chosen invoice template. Save settings first, then refresh the preview to see it.</p>
      </div>

      <label className="block">
        <span className="g6-label">Watermark Text</span>
        <input
          name="watermarkText"
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="e.g. ORIGINAL"
          maxLength={60}
          className="g6-input"
        />
      </label>

      <label className="block">
        <span className="g6-label">Footer Text</span>
        <textarea
          name="footerText"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
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
