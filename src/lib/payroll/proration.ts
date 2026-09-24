import { startOfUtcDay } from "@/lib/billingDates";
import { fromCents, toCents } from "./money";

/**
 * Works out what salary a month owes an employee, prorating for partial months.
 *
 * Walks every calendar day of the month and asks two questions per day: was the
 * employee employed, and which SalaryRecord was in effect? Twenty-eight to
 * thirty-one iterations, which is free, and it collapses mid-month joins,
 * mid-month exits and any number of mid-month increments into one code path
 * with no special cases. The segment-based alternative is faster and is where
 * off-by-one bugs live.
 *
 * All comparisons are on UTC day boundaries via startOfUtcDay, because the
 * deployment target is Vercel and local-time date maths drifts there. The same
 * lesson is recorded in the header comment of src/lib/billingDates.ts.
 *
 * Accrual happens in fractional sen and is rounded exactly once, at the end.
 * Rounding per day would drift: 5000 / 31 is 16129.032 sen, and sixteen days of
 * that is 2580.65, not the 2580.64 that sixteen pre-rounded days would give.
 *
 * @param month 1-indexed, matching PayrollRun.month.
 */
export function prorateSalaryForMonth(params: {
  year: number;
  month: number;
  salaryRecords: { monthlySalary: number; effectiveFrom: Date }[];
  hiredOn: Date;
  endedOn?: Date | null;
}): { amount: number; proratedDays: number; daysInMonth: number } {
  const { year, month, salaryRecords, hiredOn, endedOn } = params;

  // Day 0 of the following month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const hiredAt = startOfUtcDay(hiredOn).getTime();
  const endedAt = endedOn ? startOfUtcDay(endedOn).getTime() : null;

  // Newest first, so the first match walking the list is the record in effect.
  const records = salaryRecords
    .map((record) => ({
      cents: toCents(record.monthlySalary),
      effectiveAt: startOfUtcDay(record.effectiveFrom).getTime(),
    }))
    .sort((a, b) => b.effectiveAt - a.effectiveAt);

  let accruedCents = 0;
  let proratedDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayAt = Date.UTC(year, month - 1, day);

    if (dayAt < hiredAt) continue;
    if (endedAt !== null && dayAt > endedAt) continue;

    const record = records.find((candidate) => candidate.effectiveAt <= dayAt);
    if (!record) continue;

    accruedCents += record.cents / daysInMonth;
    proratedDays++;
  }

  return {
    amount: fromCents(Math.round(accruedCents)),
    proratedDays,
    daysInMonth,
  };
}
