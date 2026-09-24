"use client";

import { useActionState } from "react";
import { updateEmployerDetailsAction, type FormState } from "@/actions/payrollSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

export function EmployerDetailsForm({
  employeeCodePrefix,
  businessRegNumber,
  epfEmployerNumber,
  socsoEmployerNumber,
  lhdnEmployerNumber,
}: {
  employeeCodePrefix: string;
  businessRegNumber: string;
  epfEmployerNumber: string;
  socsoEmployerNumber: string;
  lhdnEmployerNumber: string;
}) {
  const [state, formAction, pending] = useActionState(updateEmployerDetailsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Employer details saved.</SuccessBanner> : null}

      <div>
        <FormField label="Employee Code Prefix" name="employeeCodePrefix" required defaultValue={employeeCodePrefix} />
        <p className="mt-1 text-xs text-[#5c5770]">
          Only affects codes allocated from now on. Existing employee codes are unchanged.
        </p>
      </div>
      <FormField label="Business Registration Number" name="businessRegNumber" defaultValue={businessRegNumber} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="EPF Employer Number" name="epfEmployerNumber" defaultValue={epfEmployerNumber} />
        <FormField label="SOCSO Employer Number" name="socsoEmployerNumber" defaultValue={socsoEmployerNumber} />
      </div>
      <FormField label="LHDN Employer Number" name="lhdnEmployerNumber" defaultValue={lhdnEmployerNumber} />

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Employer Details"}
      </button>
    </form>
  );
}
