/** UTC calendar-day helpers for recurring billing (avoids timezone drift on Vercel). */

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return startOfUtcDay(new Date(Date.UTC(year, month - 1, day)));
}

export function billingDayFromDate(date: Date): number {
  return date.getUTCDate();
}

export function addMonthsOnBillingDay(from: Date, billingDay: number): Date {
  const anchor = startOfUtcDay(from);
  const next = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1));
  const daysInMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(billingDay, daysInMonth));
  return startOfUtcDay(next);
}

export function upcomingBillingDates(
  nextBillingDate: Date,
  billingDay: number,
  count: number
): Date[] {
  const dates: Date[] = [];
  let cursor = startOfUtcDay(nextBillingDate);
  for (let i = 0; i < count; i++) {
    dates.push(new Date(cursor));
    cursor = addMonthsOnBillingDay(cursor, billingDay);
  }
  return dates;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { timeZone: "UTC" });
}
