import Link from "next/link";
import { Badge, employeeStatusVariant } from "@/components/Badge";
import { startOfUtcDay } from "@/lib/billingDates";
import { requireAdmin } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/stats";

export default async function StaffPage() {
  await requireAdmin();

  const today = startOfUtcDay(new Date());
  const employees = await prisma.employee.findMany({
    include: {
      // Latest record that has already taken effect — not a future raise.
      salaryRecords: {
        where: { effectiveFrom: { lte: today } },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: [{ status: "asc" }, { employeeCode: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="g6-page-title">Staff</h1>
        <Link href="/admin/staff/new" className="g6-btn g6-btn-primary">
          + Add Staff
        </Link>
      </div>

      <div className="g6-table-wrap">
        <table className="g6-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Status</th>
              <th>Current Salary</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="font-mono-g6">{employee.employeeCode}</td>
                <td className="font-medium">{employee.fullName}</td>
                <td>{employee.designation}</td>
                <td>{employee.department || "—"}</td>
                <td>
                  <Badge variant={employeeStatusVariant(employee.status)}>{employee.status}</Badge>
                </td>
                <td className="font-mono-g6">
                  {formatMoney(Number(employee.salaryRecords[0]?.monthlySalary ?? 0))}
                </td>
                <td className="text-right">
                  <Link href={`/admin/staff/${employee.id}`} className="text-[#9d84ff] hover:text-[#cabfff]">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#5c5770]">
                  No staff yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
