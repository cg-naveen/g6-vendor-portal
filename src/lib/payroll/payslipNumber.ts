/**
 * Payslip numbers are run-scoped rather than sequential per employee: a payslip
 * belongs to exactly one month and one employee, so year, month and employee
 * code already identify it uniquely. There is no counter to drift or reset,
 * which is the opposite of how vendor invoice numbers work (see
 * src/lib/invoiceNumber.ts, where the sequence is vendor-scoped and resettable).
 */
export function formatPayslipNumber(year: number, month: number, employeeCode: string): string {
  return `PS-${year}-${String(month).padStart(2, "0")}-${employeeCode}`;
}

/**
 * Employee codes are a configured prefix plus a zero-padded sequence, e.g.
 * G6-EMP-009. The prefix comes from PayrollSettings.employeeCodePrefix; padding
 * is to three digits and does not truncate a longer sequence.
 */
export function formatEmployeeCode(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}
