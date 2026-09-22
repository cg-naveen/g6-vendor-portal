import Link from "next/link";
import { Badge, statusBadgeVariant } from "@/components/Badge";
import { requireAdmin } from "@/lib/currentUser";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { prisma } from "@/lib/prisma";
import { GenerateRunForm } from "./GenerateRunForm";

export default async function PayrollPage() {
  await requireAdmin();

  const [runs, settings] = await Promise.all([
    prisma.payrollRun.findMany({
      include: { _count: { select: { payslips: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    getPayrollSettings(),
  ]);

  return (
    <div className="space-y-6">
      {settings.bandsVerifiedAt === null ? <UnverifiedBandsWarning /> : null}

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <h1 className="g6-page-title">Payroll</h1>
        <GenerateRunForm />
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Status</th>
              <th>Payslips</th>
              <th>Payment</th>
              <th>Finalized</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="font-mono-g6">{`${run.year}-${String(run.month).padStart(2, "0")}`}</td>
                <td>
                  <Badge variant={run.status === "FINALIZED" ? "paid" : "draft"}>{run.status}</Badge>
                </td>
                <td>{run._count.payslips}</td>
                <td>
                  <Badge variant={statusBadgeVariant(run.paymentStatus)}>{run.paymentStatus}</Badge>
                </td>
                <td>{run.finalizedAt?.toLocaleDateString() ?? "—"}</td>
                <td className="text-right">
                  <Link href={`/admin/payroll/${run.id}`} className="text-[#9d84ff] hover:text-[#cabfff]">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {runs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5c5770]">
                  No payroll runs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UnverifiedBandsWarning() {
  return (
    <div className="g6-panel border-[color-mix(in_srgb,var(--g6-pending)_45%,transparent)] p-4">
      <p className="text-[13px] font-semibold text-[#f7c96e]">SOCSO and EIS tables are unverified</p>
      <p className="mt-1 text-[12px] text-[#a09bb5]">
        These tables were generated from the configured rates, not taken from the official PERKESO schedule. Reconcile
        them in{" "}
        <Link href="/admin/payroll-settings" className="text-[#9d84ff] hover:text-[#cabfff]">
          Payroll Settings
        </Link>{" "}
        before running real payroll.
      </p>
    </div>
  );
}
