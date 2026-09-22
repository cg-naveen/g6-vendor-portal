import "server-only";
import type { StatutoryBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPayrollSettings } from "@/lib/payrollSettings";
import type { Band, RateConfig } from "./types";

/**
 * Converts stored band rows into the plain shape the pure engine takes.
 * Prisma Decimal values are objects, so every field is coerced with Number().
 */
export function bandsFor(type: "SOCSO" | "EIS", rows: StatutoryBand[]): Band[] {
  return rows
    .filter((row) => row.type === type)
    .map((row) => ({
      wageFrom: Number(row.wageFrom),
      wageTo: Number(row.wageTo),
      employeeAmount: Number(row.employeeAmount),
      employerAmount: Number(row.employerAmount),
    }));
}

/**
 * Assembles the RateConfig the calculation engine needs from the settings
 * singleton and the band tables.
 *
 * This is the only bridge between persistence and the pure engine — calc.ts
 * never touches Prisma, which is what makes it unit-testable.
 */
export async function loadRateConfig(): Promise<RateConfig> {
  const [settings, bands] = await Promise.all([
    getPayrollSettings(),
    prisma.statutoryBand.findMany({ orderBy: { wageFrom: "asc" } }),
  ]);

  return {
    epfEmployeeRate: Number(settings.epfEmployeeRate),
    epfEmployerRate: Number(settings.epfEmployerRate),
    epfEmployerRateBelowThreshold: Number(settings.epfEmployerRateBelowThreshold),
    epfEmployerThreshold: Number(settings.epfEmployerThreshold),
    hrdfEnabled: settings.hrdfEnabled,
    hrdfRate: Number(settings.hrdfRate),
    socsoBands: bandsFor("SOCSO", bands),
    eisBands: bandsFor("EIS", bands),
  };
}
