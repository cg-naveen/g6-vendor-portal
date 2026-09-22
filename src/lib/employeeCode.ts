import "server-only";
import { prisma } from "@/lib/prisma";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { formatEmployeeCode } from "@/lib/payroll/payslipNumber";

/**
 * Next sequential employee code using the configured prefix.
 *
 * Sequential rather than random (unlike vendor codes, which are random to stay
 * short on a printed invoice) because an employee ID is an internal HR
 * reference that people read and sort. Collisions are handled by retry: the
 * unique constraint on employeeCode is the real guarantee, not this count.
 */
export async function generateEmployeeCode(): Promise<string> {
  const settings = await getPayrollSettings();

  for (let attempt = 0; attempt < 20; attempt++) {
    const count = await prisma.employee.count();
    const code = formatEmployeeCode(settings.employeeCodePrefix, count + 1 + attempt);
    const clash = await prisma.employee.findUnique({ where: { employeeCode: code } });
    if (!clash) return code;
  }

  throw new Error("Could not allocate a unique employee code");
}
