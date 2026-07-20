"use client";

import { useActionState, useState } from "react";
import { approveVendor, rejectVendor, type FormState } from "@/actions/admin";

const initialState: FormState = {};

export function ApproveForm({ vendorId, currentAccountType }: { vendorId: string; currentAccountType?: string | null }) {
  const [state, formAction, pending] = useActionState(approveVendor, initialState);
  const [accountType, setAccountType] = useState(currentAccountType ?? "FREELANCER");

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <input type="hidden" name="vendorId" value={vendorId} />
      <h3 className="text-sm font-semibold text-emerald-800">Approve Vendor</h3>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-700">Assign Account Type</span>
        <select
          name="accountType"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="BUSINESS">Business</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="CONTRACT_FREELANCER">Contract Freelancer</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Approving..." : "Approve"}
      </button>
    </form>
  );
}

export function RejectForm({ vendorId }: { vendorId: string }) {
  const [state, formAction, pending] = useActionState(rejectVendor, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="vendorId" value={vendorId} />
      <h3 className="text-sm font-semibold text-red-800">Reject Vendor</h3>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-700">Reason (optional)</span>
        <textarea name="reason" rows={2} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
      >
        {pending ? "Rejecting..." : "Reject"}
      </button>
    </form>
  );
}
