"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginUser, type FormState } from "@/actions/auth";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginUser, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p> : null}
      <FormField label="Email" name="email" type="email" required error={errors.email} />
      <FormField label="Password" name="password" type="password" required error={errors.password} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        New vendor?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
}
