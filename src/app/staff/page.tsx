import { StatCard } from "@/components/StatCard";
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

export default async function StaffDashboardPage() {
  const employee = await requireStaff();
  const latest = await prisma.payslip.findFirst({
    where: { employeeId: employee.id, run: { status: "FINALIZED" } },
    include: { run: true },
    orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="g6-page-title">Welcome back, {employee.fullName}</h1>
        <p className="g6-page-subtitle mt-1">
          {employee.designation}
          {employee.department ? ` · ${employee.department}` : ""}
        </p>
      </div>

      {latest ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Latest net pay" value={formatMoney(Number(latest.netPay))} />
            <StatCard
              label="Period"
              value={`${MONTH_NAMES[latest.run.month - 1] ?? latest.run.month} ${latest.run.year}`}
            />
            <StatCard label="Payment status" value={latest.run.paymentStatus} />
          </div>

          <div className="g6-card p-6">
            <h2 className="text-[15px] font-semibold text-[#ece9f5]">Latest payslip</h2>
            <p className="mt-1 text-sm text-[#8781a0]">View or download your latest finalized payslip.</p>
            <a
              href={`/api/payslips/${latest.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="g6-btn g6-btn-primary mt-4"
            >
              Download Latest Payslip
            </a>
          </div>
        </>
      ) : (
        <div className="g6-card p-6 text-sm text-[#a09bb5]">No payslips have been issued yet.</div>
      )}
    </div>
  );
}
