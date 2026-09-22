import "server-only";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

/**
 * The seed migration inserts this row, so the create branch is a safety net for
 * a database seeded before that migration rather than the normal path.
 */
export async function getPayrollSettings() {
  const existing = await prisma.payrollSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.payrollSettings.create({ data: { id: SINGLETON_ID } });
}
