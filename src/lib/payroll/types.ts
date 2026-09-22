/**
 * Pure types for the payroll calculation engine. This file must never import
 * from @prisma/client — the engine is deliberately decoupled from persistence
 * so it can be unit-tested without a database.
 *
 * Every monetary value here is in RINGGIT (not sen). Conversion to sen happens
 * inside the calculation modules; sen never leak across these boundaries.
 */

export type Band = {
  /** Exclusive lower bound. A wage w falls in this band when wageFrom < w <= wageTo. */
  wageFrom: number;
  /** Inclusive upper bound. */
  wageTo: number;
  employeeAmount: number;
  employerAmount: number;
};

export type LineKind =
  /** Adds to gross; the three flags select which bases it feeds. */
  | "EARNING"
  /** Reduces gross and each flagged base (unpaid leave, no-pay day). */
  | "WAGE_DEDUCTION"
  /** Reduces net only, after contributions (advance recovery, staff loan). */
  | "NET_DEDUCTION";

export type LineInput = {
  kind: LineKind;
  amount: number;
  taxable: boolean;
  epfApplicable: boolean;
  socsoApplicable: boolean;
};

export type RateConfig = {
  epfEmployeeRate: number;
  /** Applies when the EPF base is ABOVE epfEmployerThreshold. */
  epfEmployerRate: number;
  /** Applies when the EPF base is AT OR BELOW epfEmployerThreshold. */
  epfEmployerRateBelowThreshold: number;
  epfEmployerThreshold: number;
  hrdfEnabled: boolean;
  hrdfRate: number;
  socsoBands: Band[];
  eisBands: Band[];
};

export type EmployeeCalcFacts = {
  epfEnabled: boolean;
  socsoEnabled: boolean;
  eisEnabled: boolean;
  epfEmployeeRateOverride: number | null;
  epfEmployerRateOverride: number | null;
  /** Employee-elected fixed monthly amount, not a computed figure. */
  monthlyZakat: number;
  /** Hand-entered by admin from the LHDN schedule. The engine never derives this. */
  pcb: number;
};

export type PayslipCalcOutput = {
  grossPay: number;
  taxablePay: number;
  epfBase: number;
  socsoBase: number;
  epfEmployee: number;
  epfEmployer: number;
  socsoEmployee: number;
  socsoEmployer: number;
  eisEmployee: number;
  eisEmployer: number;
  zakat: number;
  pcb: number;
  hrdfEmployer: number;
  totalEmployeeDeductions: number;
  totalEmployerCost: number;
  netPay: number;
};
