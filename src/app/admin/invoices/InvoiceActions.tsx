"use client";

import { useActionState, useState } from "react";
import { markInvoicePaidAction, markInvoiceUnpaidAction, type FormState } from "@/actions/payments";

const initialState: FormState = {};

export function MarkInvoicePaidInline({ submissionId, vendorId, defaultAmount }: { submissionId: string; vendorId: string; defaultAmount: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(markInvoicePaidAction, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-[#5ee8c0] hover:underline">
        Mark as Paid
      </button>
    );
  }

  return (
    <form action={formAction} className="w-56 space-y-2 rounded-[11px] border border-white/10 bg-black/30 p-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="vendorId" value={vendorId} />
      {state.error ? <p className="text-[11px] text-[#ff9494]">{state.error}</p> : null}
      <label className="block">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#8781a0]">Amount Paid</span>
        <input
          name="amountPaid"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultAmount.toFixed(2)}
          required
          className="g6-input py-1.5 text-xs"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#8781a0]">Transaction Fee</span>
        <input name="transactionFee" type="number" step="0.01" min="0" defaultValue="0.00" required className="g6-input py-1.5 text-xs" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="g6-btn g6-btn-primary g6-btn-sm flex-1">
          {pending ? "Saving..." : "Confirm"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="g6-btn g6-btn-ghost g6-btn-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function MarkInvoiceUnpaidButton({ submissionId, vendorId }: { submissionId: string; vendorId: string }) {
  const [, formAction, pending] = useActionState(markInvoiceUnpaidAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Revert this invoice to Unpaid? Its receipt will be removed.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="vendorId" value={vendorId} />
      <button type="submit" disabled={pending} className="text-xs text-[#ff9494] hover:underline">
        {pending ? "Saving..." : "Mark as Unpaid"}
      </button>
    </form>
  );
}
