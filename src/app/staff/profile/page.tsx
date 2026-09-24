import { changeStaffPassword } from "@/actions/staff";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { requireStaff } from "@/lib/currentUser";
import { StaffProfileForm } from "./StaffProfileForm";

export default async function StaffProfilePage() {
  const employee = await requireStaff();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="g6-page-title">{employee.fullName}</h1>
        <p className="g6-page-subtitle mt-1">{employee.email}</p>
      </div>

      <div className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Employment details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Employee code" value={employee.employeeCode} mono />
          <Detail label="Designation" value={employee.designation} />
          <Detail label="Department" value={employee.department} />
          <Detail
            label="Hire date"
            value={employee.hiredOn.toLocaleDateString("en-GB", { timeZone: "UTC" })}
          />
          <Detail label="NRIC / Passport" value={employee.nricOrPassport} mono />
          <Detail label="EPF number" value={employee.epfNumber} mono />
          <Detail label="SOCSO number" value={employee.socsoNumber} mono />
          <Detail label="PCB number" value={employee.pcbNumber} mono />
        </dl>
        <p className="mt-5 text-xs text-[#8781a0]">
          Contact your administrator to correct any of these.
        </p>
      </div>

      <div className="g6-card p-6">
        <StaffProfileForm
          employee={{
            phone: employee.phone,
            addressLine1: employee.addressLine1,
            addressLine2: employee.addressLine2,
            city: employee.city,
            postcode: employee.postcode,
            state: employee.state,
            country: employee.country,
            bankName: employee.bankName,
            accountNumber: employee.accountNumber,
            accountHolderName: employee.accountHolderName,
          }}
        />
      </div>

      <div className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Change Password</h2>
        <PasswordChangeForm action={changeStaffPassword} />
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="g6-label">{label}</dt>
      <dd className={`mt-1 text-sm text-[#ece9f5] ${mono ? "font-mono-g6" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
