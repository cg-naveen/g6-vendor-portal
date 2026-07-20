"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser, type FormState } from "@/actions/auth";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/ErrorBanner";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginUser, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      <FormField label="Email" name="email" type="email" required error={errors.email} />
      <div>
        <FormField label="Password" name="password" type="password" required error={errors.password} />
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-[#9d84ff] hover:text-[#cabfff]">
            Forgot password?
          </Link>
        </div>
      </div>
      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-[#8781a0]">
        New vendor?{" "}
        <Link href="/register" className="font-medium text-[#9d84ff] hover:text-[#cabfff]">
          Register here
        </Link>
      </p>
    </form>
  );
}
