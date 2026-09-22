import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { requireAdmin } from "@/lib/currentUser";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";
import { FinalizeRunForm } from "./FinalizeRunForm";
import { PcbInlineInput } from "./PcbInlineInput";
import { RegeneratePdfsButton } from "./RegeneratePdfsButton";

const MONTH_NAMES = [
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

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [run, settings] = await Promise.all([
    prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: { employee: { select: { employeeCode: true } }, lines: true },
          orderBy: { payslipNumber: "asc" },
        },
      },
    }),
    getPayrollSettings(),
  ]);
  if (!run) notFound();

  const totals = run.payslips.reduce(
    (acc, payslip) => ({
      gross: acc.gross + Number(payslip.grossPay),
      net: acc.net + Number(payslip.netPay),
      employerCost: acc.employerCost + Number(payslip.totalEmployerCost),
    }),
    { gross: 0, net: 0, employerCost: 0 }
  );
  const isDraft = run.status === "DRAFT";
  const missingPdfs = run.payslips.filter((payslip) => !payslip.pdfPath).length;
  const monthName = MONTH_NAMES[run.month - 1] ?? String(run.month);

  return (
    <div className="space-y-6">
      {settings.bandsVerifiedAt === null ? <UnverifiedBandsWarning /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="g6-page-title">{`Payroll — ${monthName} ${run.year}`}</h1>
        <Badge variant={run.status === "FINALIZED" ? "paid" : "draft"}>{run.status}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total gross" value={formatMoney(totals.gross)} />
        <StatCard label="Total net pay" value={formatMoney(totals.net)} />
        <StatCard label="Total employer cost" value={formatMoney(totals.employerCost)} />
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Payslip #</th>
              <th>Employee</th>
              <th>Days</th>
              <th className="text-right">Gross</th>
              <th className="text-right">EPF</th>
              <th className="text-right">SOCSO</th>
              <th className="text-right">EIS</th>
              <th className="text-right">PCB</th>
              <th className="text-right">Net</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {run.payslips.map((payslip) => (
              <tr key={payslip.id}>
                <td className="font-mono-g6">{payslip.payslipNumber}</td>
                <td>
                  <div className="font-medium">{payslip.employeeName}</div>
                  <div className="font-mono-g6 text-xs text-[#8781a0]">{payslip.employee.employeeCode}</div>
                </td>
                <td>
                  {payslip.proratedDays === payslip.daysInMonth
                    ? "Full"
                    : `${payslip.proratedDays}/${payslip.daysInMonth}`}
                </td>
                <td className="text-right font-mono-g6">{formatMoney(Number(payslip.grossPay))}</td>
                <td className="text-right font-mono-g6">{formatMoney(Number(payslip.epfEmployee))}</td>
                <td className="text-right font-mono-g6">{formatMoney(Number(payslip.socsoEmployee))}</td>
                <td className="text-right font-mono-g6">{formatMoney(Number(payslip.eisEmployee))}</td>
                <td className="text-right font-mono-g6">
                  {isDraft ? (
                    <PcbInlineInput
                      payslipId={payslip.id}
                      value={payslip.pcb === null ? null : Number(payslip.pcb)}
                    />
                  ) : (
                    formatMoney(Number(payslip.pcb))
                  )}
                </td>
                <td
                  className={`text-right font-mono-g6 ${Number(payslip.netPay) < 0 ? "text-[#ff9494]" : ""}`}
                >
                  {formatMoney(Number(payslip.netPay))}
                </td>
                <td className="text-right">
                  {isDraft ? (
                    <Link
                      href={`/admin/payroll/${run.id}/payslips/${payslip.id}/edit`}
                      className="text-[#9d84ff] hover:text-[#cabfff]"
                    >
                      Edit lines
                    </Link>
                  ) : payslip.pdfPath ? (
                    <a
                      href={`/api/payslips/${payslip.id}/pdf`}
                      className="text-[#9d84ff] hover:text-[#cabfff]"
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="text-[#ff9494]">PDF missing</span>
                  )}
                </td>
              </tr>
            ))}
            {run.payslips.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#5c5770]">
                  No payslips in this run.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {isDraft ? (
        <FinalizeRunForm runId={run.id} bandsVerified={settings.bandsVerifiedAt !== null} />
      ) : missingPdfs > 0 ? (
        <RegeneratePdfsButton runId={run.id} missing={missingPdfs} />
      ) : null}
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
