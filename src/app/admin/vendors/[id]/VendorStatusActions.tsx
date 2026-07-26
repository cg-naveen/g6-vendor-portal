"use client";

import { useActionState, useState } from "react";
import { changeVendorStatus, type FormState } from "@/actions/admin";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { VendorStatus, AccountType } from "@prisma/client";

const initialState: FormState = {};

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "BUSINESS", label: "Business" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "CONTRACT_FREELANCER", label: "Contract Freelancer" },
];

/**
 * Contextual status management for the vendor detail page. Only renders the
 * controls that make sense for the current status, instead of always showing
 * an approve/reject form.
 */
export function VendorStatusActions({
  vendorId,
  status,
  currentAccountType,
}: {
  vendorId: string;
  status: VendorStatus;
  currentAccountType: AccountType | null;
}) {
  const [state, formAction, pending] = useActionState(changeVendorStatus, initialState);
  const [accountType, setAccountType] = useState<AccountType>(currentAccountType ?? "FREELANCER");
  const [showReject, setShowReject] = useState(false);

  return (
    <section className="g6-card space-y-4 p-5">
      <h2 className="g6-section-label">Manage Status</h2>
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      {status === "PENDING" || status === "REJECTED" ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="approve" />
          <label className="block">
            <span className="g6-label">Assign Account Type</span>
            <select
              name="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="g6-input g6-select"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={pending} className="g6-btn w-full" style={{ background: "#34d6a8", color: "#08160f" }}>
            {pending ? "Saving..." : status === "REJECTED" ? "Approve Instead" : "Approve Vendor"}
          </button>
        </form>
      ) : null}

      {status === "PENDING" ? (
        showReject ? (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="vendorId" value={vendorId} />
            <input type="hidden" name="action" value="reject" />
            <label className="block">
              <span className="g6-label">Rejection Reason (optional)</span>
              <textarea name="reason" rows={2} className="g6-input" placeholder="Why is this being rejected?" />
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="g6-btn g6-btn-danger flex-1">
                Confirm Reject
              </button>
              <button type="button" onClick={() => setShowReject(false)} className="g6-btn g6-btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowReject(true)} className="g6-btn g6-btn-danger w-full">
            Reject Vendor
          </button>
        )
      ) : null}

      {status === "APPROVED" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="block" />
          <button type="submit" disabled={pending} className="g6-btn g6-btn-danger w-full">
            {pending ? "Blocking..." : "Block Vendor"}
          </button>
          <p className="mt-2 text-xs text-[#8781a0]">A blocked vendor keeps its data but cannot log in to the portal.</p>
        </form>
      ) : null}

      {status === "BLOCKED" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="unblock" />
          <button type="submit" disabled={pending} className="g6-btn w-full" style={{ background: "#34d6a8", color: "#08160f" }}>
            {pending ? "Unblocking..." : "Unblock Vendor"}
          </button>
        </form>
      ) : null}

      {status === "REJECTED" || status === "BLOCKED" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="reopen" />
          <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary w-full">
            Move Back to Pending
          </button>
        </form>
      ) : null}
    </section>
  );
}
