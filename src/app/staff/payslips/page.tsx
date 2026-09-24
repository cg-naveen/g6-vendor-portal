import { Badge, statusBadgeVariant } from "@/components/Badge";
import { requireStaff } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";

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
];

export default async function StaffPayslipsPage() {
  const employee = await requireStaff();
  const payslips = await prisma.payslip.findMany({
    where: { employeeId: employee.id, run: { status: "FINALIZED" } },
    include: { run: true },
    orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="g6-page-title">Payslips</h1>
        <p className="g6-page-subtitle mt-1">Your finalized payroll history.</p>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Payslip #</th>
              <th>Period</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Deductions</th>
              <th className="text-right">Net</th>
              <th>Payment</th>
              <th className="text-right">PDF</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((payslip) => (
              <tr key={payslip.id}>
                <td className="font-mono-g6">{payslip.payslipNumber}</td>
                <td>{`${MONTH_NAMES[payslip.run.month - 1] ?? payslip.run.month} ${payslip.run.year}`}</td>
                <td className="text-right">{formatMoney(Number(payslip.grossPay))}</td>
                <td className="text-right">{formatMoney(Number(payslip.totalEmployeeDeductions))}</td>
                <td className="text-right font-mono-g6 font-semibold text-[#ece9f5]">
                  {formatMoney(Number(payslip.netPay))}
                </td>
                <td>
                  <Badge variant={statusBadgeVariant(payslip.run.paymentStatus)}>
                    {payslip.run.paymentStatus}
                  </Badge>
                </td>
                <td className="text-right">
                  {payslip.pdfPath ? (
                    <a
                      href={`/api/payslips/${payslip.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#9d84ff] hover:text-[#cabfff]"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-[#5c5770]">Preparing</span>
                  )}
                </td>
              </tr>
            ))}
            {payslips.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#5c5770]">
                  No payslips yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
