"use client";

import { useActionState, useState } from "react";
import { changeVendorStatus, type FormState } from "@/actions/admin";
import type { VendorStatus, AccountType } from "@prisma/client";

const initialState: FormState = {};

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "BUSINESS", label: "Business" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "CONTRACT_FREELANCER", label: "Contract" },
];

/**
 * Compact inline status controls for a vendor row in the list / dashboard.
 * Approve carries an account-type picker; block / unblock / reject are one-click.
 */
export function VendorListActions({
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

  const canApprove = status === "PENDING" || status === "REJECTED";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {state.error ? <span className="text-[11px] text-[#ff9494]">{state.error}</span> : null}

      {canApprove ? (
        <form action={formAction} className="flex items-center gap-1.5">
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="approve" />
          <select
            name="accountType"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="g6-input g6-select !py-1.5 !text-xs"
            style={{ width: 118 }}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pending} className="g6-btn g6-btn-sm" style={{ background: "#34d6a8", color: "#08160f" }}>
            Approve
          </button>
        </form>
      ) : null}

      {status === "PENDING" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="reject" />
          <button type="submit" disabled={pending} className="g6-btn g6-btn-danger g6-btn-sm">
            Reject
          </button>
        </form>
      ) : null}

      {status === "APPROVED" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="block" />
          <button type="submit" disabled={pending} className="g6-btn g6-btn-danger g6-btn-sm">
            Block
          </button>
        </form>
      ) : null}

      {status === "BLOCKED" ? (
        <form action={formAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="action" value="unblock" />
          <button type="submit" disabled={pending} className="g6-btn g6-btn-sm" style={{ background: "#34d6a8", color: "#08160f" }}>
            Unblock
          </button>
        </form>
      ) : null}
    </div>
  );
}
