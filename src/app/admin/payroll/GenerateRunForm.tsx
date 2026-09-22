"use client";

import { useActionState } from "react";
import { generateRunAction, type FormState } from "@/actions/payroll";
import { ErrorBanner } from "@/components/ErrorBanner";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const initialState: FormState = {};

export function GenerateRunForm() {
  const [state, formAction, pending] = useActionState(generateRunAction, initialState);
  const now = new Date();
  const previousMonth = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();

  return (
    <form action={formAction} className="flex flex-wrap items-end justify-end gap-2">
      <label>
        <span className="sr-only">Payroll month</span>
        <select name="month" defaultValue={previousMonth} className="g6-input min-w-36" disabled={pending}>
          {MONTHS.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Payroll year</span>
        <input
          name="year"
          type="number"
          min="2000"
          max="2100"
          defaultValue={now.getUTCFullYear()}
          className="g6-input w-28"
          disabled={pending}
        />
      </label>
      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Generating..." : "Generate Payroll"}
      </button>
      {state.error ? (
        <div className="basis-full">
          <ErrorBanner>{state.error}</ErrorBanner>
        </div>
      ) : null}
    </form>
  );
}
