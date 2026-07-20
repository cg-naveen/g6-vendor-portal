"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type RequestResetState } from "@/actions/passwordReset";
import { FormField } from "@/components/FormField";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

const initialState: RequestResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.resetLink !== undefined) {
    return (
      <div className="space-y-4">
        <SuccessBanner>If an account exists for that email, a reset link has been generated.</SuccessBanner>
        {state.resetLink ? (
          <div className="g6-panel space-y-2 p-4">
            <p className="text-xs text-[#8781a0]">
              This app doesn&apos;t send email yet, so here&apos;s your one-time reset link — normally this would be emailed to you:
            </p>
            <Link href={state.resetLink} className="block break-all text-sm text-[#9d84ff] hover:text-[#cabfff]">
              {typeof window !== "undefined" ? window.location.origin : ""}
              {state.resetLink}
            </Link>
          </div>
        ) : null}
        <Link href="/login" className="block text-center text-sm text-[#8781a0] hover:text-[#cabfff]">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      <FormField label="Email" name="email" type="email" required />
      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Sending..." : "Send Reset Link"}
      </button>
      <p className="text-center text-sm text-[#8781a0]">
        <Link href="/login" className="font-medium text-[#9d84ff] hover:text-[#cabfff]">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
