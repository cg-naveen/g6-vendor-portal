import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { formatDisplayDate } from "@/lib/billingDates";
import { requireAdmin } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { EmploymentStatusForm } from "./EmploymentStatusForm";
import { SalaryHistorySection } from "./SalaryHistorySection";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      salaryRecords: { orderBy: { effectiveFrom: "desc" } },
      payslips: {
        include: { run: true },
        orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
      },
    },
  });
  if (!employee) notFound();

  const currentSalary = employee.salaryRecords[0];
  const address = [
    employee.addressLine1,
    employee.addressLine2,
    [employee.postcode, employee.city].filter(Boolean).join(" "),
    employee.state,
    employee.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="g6-page-title">{employee.fullName}</h1>
          <p className="g6-page-subtitle mt-1">
            {employee.designation} · {employee.employeeCode}
          </p>
        </div>
        <Link href={`/admin/staff/${employee.id}/edit`} className="g6-btn g6-btn-secondary">
          Edit Details
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Current salary"
          value={formatMoney(Number(currentSalary?.monthlySalary ?? 0))}
          hint={currentSalary ? `Effective ${formatDisplayDate(currentSalary.effectiveFrom)}` : "No salary record"}
        />
        <StatCard
          label="Employment"
          value={employee.status}
          hint={`Hired ${formatDisplayDate(employee.hiredOn)}`}
          hintColor={employee.status === "ACTIVE" ? "paid" : employee.status === "TERMINATED" ? "overdue" : "muted"}
        />
        <StatCard label="Payslips" value={String(employee.payslips.length)} hint="Issued payroll records" />
      </div>

      <section className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Profile</h2>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Detail label="Department" value={employee.department} />
          <Detail label="Nationality" value={employee.nationality} />
          <Detail label="Gender" value={employee.gender} />
          <Detail label="NRIC / Passport" value={employee.nricOrPassport} />
          <Detail label="EPF Number" value={employee.epfNumber} />
          <Detail label="SOCSO Number" value={employee.socsoNumber} />
          <Detail label="PCB Number" value={employee.pcbNumber} />
          <Detail label="Profile Email" value={employee.email} />
          <Detail label="Login Email" value={employee.user.email} />
          <Detail label="Phone" value={employee.phone} />
          <Detail label="Home Address" value={address} full />
          <Detail label="Bank Name" value={employee.bankName} />
          <Detail label="Account Number" value={employee.accountNumber} />
          <Detail label="Account Holder" value={employee.accountHolderName} />
          <Detail label="EPF Applicable" value={employee.epfEnabled ? "Yes" : "No"} />
          <Detail label="SOCSO Applicable" value={employee.socsoEnabled ? "Yes" : "No"} />
          <Detail label="EIS Applicable" value={employee.eisEnabled ? "Yes" : "No"} />
          <Detail label="Monthly Zakat" value={employee.monthlyZakat ? formatMoney(Number(employee.monthlyZakat)) : null} />
          <Detail label="Tax Resident" value={employee.taxResident ? "Yes" : "No"} />
          <Detail label="PCB Worker Category" value={employee.taxWorkerCategory} />
          <Detail label="PCB Marital Status" value={employee.taxMaritalStatus} />
          <Detail label="PCB Dependents" value={String(employee.taxDependents)} />
        </dl>
      </section>

      <section className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Salary history</h2>
        <SalaryHistorySection
          employeeId={employee.id}
          records={employee.salaryRecords.map((record) => ({
            id: record.id,
            effectiveFrom: record.effectiveFrom.toISOString(),
            monthlySalary: Number(record.monthlySalary),
            reason: record.reason,
          }))}
        />
      </section>

      <section className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Employment status</h2>
        <EmploymentStatusForm
          employeeId={employee.id}
          status={employee.status}
          endedOn={employee.endedOn?.toISOString().slice(0, 10) ?? null}
        />
      </section>

      <section className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Payslips</h2>
        <div className="overflow-x-auto">
          <table className="g6-table">
            <thead>
              <tr>
                <th>Payslip #</th>
                <th>Period</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Status</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {employee.payslips.map((payslip) => (
                <tr key={payslip.id}>
                  <td className="font-mono-g6">{payslip.payslipNumber}</td>
                  <td>{`${payslip.run.year}-${String(payslip.run.month).padStart(2, "0")}`}</td>
                  <td className="font-mono-g6">{formatMoney(Number(payslip.grossPay))}</td>
                  <td className="font-mono-g6">{formatMoney(Number(payslip.netPay))}</td>
                  <td>
                    <Badge variant={statusBadgeVariant(payslip.run.status === "FINALIZED" ? "APPROVED" : "PENDING")}>
                      {payslip.run.status}
                    </Badge>
                  </td>
                  <td>
                    {payslip.pdfPath ? (
                      <a href={`/api/payslips/${payslip.id}/pdf`} className="text-[#9d84ff] hover:text-[#cabfff]">
                        View PDF
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {employee.payslips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5c5770]">
                    No payslips yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs uppercase text-[#5c5770]">{label}</dt>
      <dd className="text-[#dcd8ea]">{value || "—"}</dd>
    </div>
  );
}
