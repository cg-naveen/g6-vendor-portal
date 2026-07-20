"use client";

import { useActionState } from "react";
import { runBillingNowAction, type RunBillingState } from "@/actions/admin";

const initialState: RunBillingState = {};

export function RunBillingButton() {
  const [state, formAction, pending] = useActionState(runBillingNowAction, initialState);

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
          {pending ? "Running..." : "Run Billing Now"}
        </button>
      </form>
      {state.message ? <p className="max-w-xs text-right text-xs text-[#8781a0]">{state.message}</p> : null}
    </div>
  );
}
