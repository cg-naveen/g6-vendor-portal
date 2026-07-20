"use client";

import { useActionState, useState } from "react";
import { updateInvoiceSettings, type FormState } from "@/actions/invoiceSettings";
import type { InvoiceTemplate } from "@prisma/client";

const TEMPLATES: { id: InvoiceTemplate; name: string; description: string; accent: string }[] = [
  { id: "CLASSIC", name: "Classic", description: "Traditional bordered layout with a bold dark header.", accent: "#1f2937" },
  { id: "MODERN", name: "Modern", description: "Colorful banner header with card-style sections.", accent: "#4f46e5" },
  { id: "MINIMAL", name: "Minimal", description: "Clean, whitespace-driven layout with light typography.", accent: "#18181b" },
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

      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Settings saved.</p> : null}

      <div>
        <span className="mb-3 block text-sm font-medium text-zinc-700">Invoice Template</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`rounded-xl border p-4 text-left ${
                template === t.id ? "border-indigo-500 ring-2 ring-indigo-200" : "border-zinc-200"
              }`}
            >
              <div className="mb-3 h-16 rounded-md" style={{ backgroundColor: t.accent }} />
              <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700">Logo {hasLogo ? "(currently set)" : ""}</span>
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element -- dynamic API-served image, next/image not needed here
          <img src="/api/vendor/logo" alt="Current logo" className="mb-2 h-16 rounded border border-zinc-200 bg-white object-contain p-1" />
        ) : null}
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="block w-full rounded-md border border-zinc-300 text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-zinc-400">Shown at the top of your generated invoices.</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Watermark Text</span>
        <input
          name="watermarkText"
          type="text"
          defaultValue={currentWatermark}
          placeholder="e.g. ORIGINAL"
          maxLength={60}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">Footer Text</span>
        <textarea
          name="footerText"
          defaultValue={currentFooter}
          rows={2}
          maxLength={200}
          placeholder="e.g. Thank you for your business. Payment due within 30 days."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
