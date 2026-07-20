"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "@/actions/passwordReset";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      <FormField label="New Password" name="password" type="password" required placeholder="At least 8 characters" />
      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Saving..." : "Set New Password"}
      </button>
    </form>
  );
}
