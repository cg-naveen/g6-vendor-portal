"use client";

import { useActionState, useState } from "react";
import { approveVendor, rejectVendor, type FormState } from "@/actions/admin";

const initialState: FormState = {};

export function ApproveForm({ vendorId, currentAccountType }: { vendorId: string; currentAccountType?: string | null }) {
  const [state, formAction, pending] = useActionState(approveVendor, initialState);
  const [accountType, setAccountType] = useState(currentAccountType ?? "FREELANCER");

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[16px] border p-4"
      style={{ borderColor: "color-mix(in srgb, #34d6a8 30%, transparent)", background: "color-mix(in srgb, #34d6a8 8%, transparent)" }}
    >
      <input type="hidden" name="vendorId" value={vendorId} />
      <h3 className="text-sm font-semibold text-[#5ee8c0]">Approve Vendor</h3>
      {state.error ? <p className="text-xs text-[#ff9494]">{state.error}</p> : null}
      <label className="block">
        <span className="g6-label">Assign Account Type</span>
        <select name="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)} className="g6-input g6-select">
          <option value="BUSINESS">Business</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="CONTRACT_FREELANCER">Contract Freelancer</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className="g6-btn w-full" style={{ background: "#34d6a8", color: "#08160f" }}>
        {pending ? "Approving..." : "Approve"}
      </button>
    </form>
  );
}

export function RejectForm({ vendorId }: { vendorId: string }) {
  const [state, formAction, pending] = useActionState(rejectVendor, initialState);

  return (
    <form className="g6-card space-y-3 p-4" action={formAction}>
      <input type="hidden" name="vendorId" value={vendorId} />
      <h3 className="text-sm font-semibold text-[#ff9494]">Reject Vendor</h3>
      {state.error ? <p className="text-xs text-[#ff9494]">{state.error}</p> : null}
      <label className="block">
        <span className="g6-label">Reason (optional)</span>
        <textarea name="reason" rows={2} className="g6-input" />
      </label>
      <button type="submit" disabled={pending} className="g6-btn g6-btn-danger w-full">
        {pending ? "Rejecting..." : "Reject"}
      </button>
    </form>
  );
}
