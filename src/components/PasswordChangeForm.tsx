"use client";

import { useActionState } from "react";
import { FormField } from "@/components/FormField";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

type FormState = { error?: string; success?: boolean };

export function PasswordChangeForm({ action }: { action: (prevState: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Password updated.</SuccessBanner> : null}
      <FormField label="Current Password" name="currentPassword" type="password" required />
      <FormField label="New Password" name="newPassword" type="password" required placeholder="At least 8 characters" />
      <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
        {pending ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
