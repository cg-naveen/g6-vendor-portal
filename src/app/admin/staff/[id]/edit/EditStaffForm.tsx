"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateEmployee, type FormState } from "@/actions/staff";
import { ErrorBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";

export type EditStaffFields = {
  id: string;
  fullName: string;
  designation: string;
  department: string | null;
  nationality: string | null;
  gender: string | null;
  nricOrPassport: string;
  epfNumber: string | null;
  socsoNumber: string | null;
  pcbNumber: string | null;
  email: string;
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  state: string | null;
  country: string | null;
  bankName: string;
  accountNumber: string;
  accountHolderName: string | null;
  hiredOn: string;
  epfEnabled: boolean;
  socsoEnabled: boolean;
  eisEnabled: boolean;
  epfEmployeeRateOverride: string | null;
  epfEmployerRateOverride: string | null;
  monthlyZakat: string | null;
  taxResident: boolean;
  taxWorkerCategory: string | null;
  taxMaritalStatus: string | null;
  taxDependents: number;
};

const initialState: FormState = {};

export function EditStaffForm({ employee }: { employee: EditStaffFields }) {
  const [state, formAction, pending] = useActionState(updateEmployee, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="employeeId" value={employee.id} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Identity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full Name" name="fullName" required defaultValue={employee.fullName} error={errors.fullName} />
          <FormField
            label="Designation"
            name="designation"
            required
            defaultValue={employee.designation}
            error={errors.designation}
          />
          <FormField label="Department" name="department" defaultValue={employee.department ?? ""} error={errors.department} />
          <FormField label="Nationality" name="nationality" defaultValue={employee.nationality ?? ""} error={errors.nationality} />
          <FormField label="Gender" name="gender" defaultValue={employee.gender ?? ""} error={errors.gender} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Statutory identifiers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="NRIC or Passport"
            name="nricOrPassport"
            required
            defaultValue={employee.nricOrPassport}
            error={errors.nricOrPassport}
          />
          <FormField label="EPF Number" name="epfNumber" defaultValue={employee.epfNumber ?? ""} error={errors.epfNumber} />
          <FormField label="SOCSO Number" name="socsoNumber" defaultValue={employee.socsoNumber ?? ""} error={errors.socsoNumber} />
          <FormField label="PCB Number" name="pcbNumber" defaultValue={employee.pcbNumber ?? ""} error={errors.pcbNumber} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Email" name="email" type="email" required defaultValue={employee.email} error={errors.email} />
          <FormField label="Phone" name="phone" required defaultValue={employee.phone} error={errors.phone} />
        </div>
        <p className="text-xs text-[#8781a0]">
          This profile email does not change the employee&apos;s login email.
        </p>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Home address</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Address Line 1" name="addressLine1" defaultValue={employee.addressLine1 ?? ""} error={errors.addressLine1} />
          <FormField label="Address Line 2" name="addressLine2" defaultValue={employee.addressLine2 ?? ""} error={errors.addressLine2} />
          <FormField label="City" name="city" defaultValue={employee.city ?? ""} error={errors.city} />
          <FormField label="Postcode" name="postcode" defaultValue={employee.postcode ?? ""} error={errors.postcode} />
          <FormField label="State" name="state" defaultValue={employee.state ?? ""} error={errors.state} />
          <FormField label="Country" name="country" defaultValue={employee.country ?? ""} error={errors.country} />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Bank details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Bank Name" name="bankName" required defaultValue={employee.bankName} error={errors.bankName} />
          <FormField
            label="Account Number"
            name="accountNumber"
            required
            defaultValue={employee.accountNumber}
            error={errors.accountNumber}
          />
          <FormField
            label="Account Holder Name"
            name="accountHolderName"
            defaultValue={employee.accountHolderName ?? ""}
            error={errors.accountHolderName}
          />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Employment</h2>
        <FormField label="Hire Date" name="hiredOn" type="date" required defaultValue={employee.hiredOn} error={errors.hiredOn} />
        <p className="text-xs text-[#8781a0]">Salary changes are recorded separately in the append-only salary history.</p>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">Statutory applicability</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Checkbox label="EPF enabled" name="epfEnabled" defaultChecked={employee.epfEnabled} />
          <Checkbox label="SOCSO enabled" name="socsoEnabled" defaultChecked={employee.socsoEnabled} />
          <Checkbox label="EIS enabled" name="eisEnabled" defaultChecked={employee.eisEnabled} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="EPF Employee Rate Override"
            name="epfEmployeeRateOverride"
            type="number"
            defaultValue={employee.epfEmployeeRateOverride ?? ""}
            placeholder="Leave blank for the statutory rate"
            error={errors.epfEmployeeRateOverride}
          />
          <FormField
            label="EPF Employer Rate Override"
            name="epfEmployerRateOverride"
            type="number"
            defaultValue={employee.epfEmployerRateOverride ?? ""}
            placeholder="Leave blank for the statutory rate"
            error={errors.epfEmployerRateOverride}
          />
          <FormField
            label="Monthly Zakat"
            name="monthlyZakat"
            type="number"
            min="0"
            defaultValue={employee.monthlyZakat ?? ""}
            error={errors.monthlyZakat}
          />
        </div>
      </section>

      <section className="g6-card space-y-4 p-6">
        <h2 className="g6-section-label">PCB profile</h2>
        <p className="text-[11px] text-[#8781a0]">
          These fields do not calculate anything. PCB is entered per payslip; this records which profile the figure was
          looked up against and prints it as a payslip footnote.
        </p>
        <Checkbox label="Tax resident" name="taxResident" defaultChecked={employee.taxResident} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Worker Category"
            name="taxWorkerCategory"
            defaultValue={employee.taxWorkerCategory ?? ""}
            error={errors.taxWorkerCategory}
          />
          <FormField
            label="Marital Status"
            name="taxMaritalStatus"
            defaultValue={employee.taxMaritalStatus ?? ""}
            error={errors.taxMaritalStatus}
          />
          <FormField
            label="Dependents"
            name="taxDependents"
            type="number"
            min="0"
            step="1"
            defaultValue={String(employee.taxDependents)}
            error={errors.taxDependents}
          />
        </div>
      </section>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <Link href={`/admin/staff/${employee.id}`} className="g6-btn g6-btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#9d84ff]" />
      <span className="g6-label mb-0">{label}</span>
    </label>
  );
}
