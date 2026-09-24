"use client";

import { useActionState } from "react";
import { createEmployee, type FormState } from "@/actions/staff";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

export function AddStaffForm() {
  const [state, formAction, pending] = useActionState(createEmployee, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Identity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" name="fullName" required error={errors.fullName} />
          <FormField label="Designation" name="designation" required error={errors.designation} />
          <FormField label="Department" name="department" error={errors.department} />
          <FormField label="Nationality" name="nationality" error={errors.nationality} />
          <FormField label="Gender" name="gender" error={errors.gender} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Statutory identifiers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="NRIC or Passport" name="nricOrPassport" required error={errors.nricOrPassport} />
          <FormField label="EPF Number" name="epfNumber" error={errors.epfNumber} />
          <FormField label="SOCSO Number" name="socsoNumber" error={errors.socsoNumber} />
          <FormField label="PCB Number" name="pcbNumber" error={errors.pcbNumber} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Contact &amp; login</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" required error={errors.email} />
          <FormField label="Phone" name="phone" required error={errors.phone} />
          <FormField label="Initial Password" name="password" type="password" required error={errors.password} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Home address</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Address Line 1" name="addressLine1" error={errors.addressLine1} />
          <FormField label="Address Line 2" name="addressLine2" error={errors.addressLine2} />
          <FormField label="City" name="city" error={errors.city} />
          <FormField label="Postcode" name="postcode" error={errors.postcode} />
          <FormField label="State" name="state" error={errors.state} />
          <FormField label="Country" name="country" error={errors.country} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Bank details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Bank Name" name="bankName" required error={errors.bankName} />
          <FormField label="Account Number" name="accountNumber" required error={errors.accountNumber} />
          <FormField label="Account Holder Name" name="accountHolderName" error={errors.accountHolderName} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Employment</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Hire Date" name="hiredOn" type="date" required error={errors.hiredOn} />
          <FormField label="Monthly Salary" name="monthlySalary" type="number" required min="0.01" error={errors.monthlySalary} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Statutory applicability</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Checkbox label="EPF enabled" name="epfEnabled" />
          <Checkbox label="SOCSO enabled" name="socsoEnabled" />
          <Checkbox label="EIS enabled" name="eisEnabled" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="EPF Employee Rate Override"
            name="epfEmployeeRateOverride"
            type="number"
            placeholder="Leave blank for the statutory rate"
            error={errors.epfEmployeeRateOverride}
          />
          <FormField
            label="EPF Employer Rate Override"
            name="epfEmployerRateOverride"
            type="number"
            placeholder="Leave blank for the statutory rate"
            error={errors.epfEmployerRateOverride}
          />
          <FormField label="Monthly Zakat" name="monthlyZakat" type="number" min="0" error={errors.monthlyZakat} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">PCB profile</h2>
        <p className="text-[11px] text-[#8781a0]">
          These fields do not calculate anything. PCB is entered per payslip; this records which profile the figure was
          looked up against and prints it as a payslip footnote.
        </p>
        <Checkbox label="Tax resident" name="taxResident" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Worker Category"
            name="taxWorkerCategory"
            defaultValue="Normal Worker"
            error={errors.taxWorkerCategory}
          />
          <FormField label="Marital Status" name="taxMaritalStatus" error={errors.taxMaritalStatus} />
          <FormField
            label="Dependents"
            name="taxDependents"
            type="number"
            min="0"
            step="1"
            defaultValue="0"
            error={errors.taxDependents}
          />
        </div>
      </section>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary w-full">
        {pending ? "Creating..." : "Create Staff Account"}
      </button>
    </form>
  );
}

function Checkbox({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked className="h-4 w-4 accent-[#9d84ff]" />
      <span className="g6-label mb-0">{label}</span>
    </label>
  );
}
