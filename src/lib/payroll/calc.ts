import { findBand } from "./bands";
import { ceilToRinggit, fromCents, pctOfCents, sumCents, toCents } from "./money";
import type { EmployeeCalcFacts, LineInput, PayslipCalcOutput, RateConfig } from "./types";

/**
 * Sums a contribution base in sen: earnings minus wage deductions, counting only
 * the lines the predicate accepts.
 *
 * NET_DEDUCTION lines are excluded from every base by construction — they are
 * recovered from net pay after contributions, not from wages.
 */
function baseCents(lines: LineInput[], applies: (line: LineInput) => boolean): number {
  const earnings = lines.filter((line) => line.kind === "EARNING" && applies(line));
  const wageDeductions = lines.filter((line) => line.kind === "WAGE_DEDUCTION" && applies(line));

  return (
    sumCents(earnings.map((line) => toCents(line.amount))) -
    sumCents(wageDeductions.map((line) => toCents(line.amount)))
  );
}

/**
 * Computes every figure on a payslip from its lines, the employee's statutory
 * facts, and a rate configuration.
 *
 * Pure and synchronous by design: no Prisma, no I/O, no clock. The caller
 * supplies an already-prorated salary line (see proration.ts) and the PCB figure
 * the admin entered by hand. PCB is never derived here — it comes from the LHDN
 * schedule and depends on a tax profile this engine deliberately does not model.
 */
export function computePayslip(input: {
  lines: LineInput[];
  employee: EmployeeCalcFacts;
  config: RateConfig;
}): PayslipCalcOutput {
  const { lines, employee, config } = input;

  const grossCents = baseCents(lines, () => true);
  const taxableCents = baseCents(lines, (line) => line.taxable);
  const epfBaseCents = baseCents(lines, (line) => line.epfApplicable);
  const socsoBaseCents = baseCents(lines, (line) => line.socsoApplicable);

  // ── EPF ── rate-driven, each side rounded up to the next ringgit.
  // The employer rate is 13% at or below the threshold and 12% above it. A
  // single employer rate would silently underpay everyone earning <= RM5,000.
  let epfEmployeeCents = 0;
  let epfEmployerCents = 0;
  if (employee.epfEnabled && epfBaseCents > 0) {
    const employeeRate = employee.epfEmployeeRateOverride ?? config.epfEmployeeRate;
    const employerRate =
      employee.epfEmployerRateOverride ??
      (epfBaseCents <= toCents(config.epfEmployerThreshold)
        ? config.epfEmployerRateBelowThreshold
        : config.epfEmployerRate);

    epfEmployeeCents = ceilToRinggit(pctOfCents(epfBaseCents, employeeRate));
    epfEmployerCents = ceilToRinggit(pctOfCents(epfBaseCents, employerRate));
  }

  // ── SOCSO and EIS ── band lookups, both against socsoBase. EIS shares the
  // SOCSO wage definition under Malaysian law; this is intentional, not a
  // copy-paste. findBand clamps above the ceiling rather than returning null.
  const socsoWage = fromCents(socsoBaseCents);
  const socsoBand = employee.socsoEnabled ? findBand(config.socsoBands, socsoWage) : null;
  const eisBand = employee.eisEnabled ? findBand(config.eisBands, socsoWage) : null;

  const socsoEmployeeCents = socsoBand ? toCents(socsoBand.employeeAmount) : 0;
  const socsoEmployerCents = socsoBand ? toCents(socsoBand.employerAmount) : 0;
  const eisEmployeeCents = eisBand ? toCents(eisBand.employeeAmount) : 0;
  const eisEmployerCents = eisBand ? toCents(eisBand.employerAmount) : 0;

  // ── Employee-elected and hand-entered ──
  const zakatCents = toCents(employee.monthlyZakat);
  const pcbCents = toCents(employee.pcb);

  // ── HRDF ── an employer levy on gross; never reaches net pay.
  const hrdfEmployerCents =
    config.hrdfEnabled && grossCents > 0 ? Math.round(pctOfCents(grossCents, config.hrdfRate)) : 0;

  const netDeductionCents = sumCents(
    lines.filter((line) => line.kind === "NET_DEDUCTION").map((line) => toCents(line.amount))
  );

  const totalEmployeeDeductionsCents =
    epfEmployeeCents +
    socsoEmployeeCents +
    eisEmployeeCents +
    zakatCents +
    pcbCents +
    netDeductionCents;

  // Reported honestly even when negative. Task 13's finalize validation refuses
  // to issue a payslip with a negative net rather than silently clamping it.
  const netPayCents = grossCents - totalEmployeeDeductionsCents;

  const totalEmployerCostCents =
    grossCents + epfEmployerCents + socsoEmployerCents + eisEmployerCents + hrdfEmployerCents;

  return {
    grossPay: fromCents(grossCents),
    taxablePay: fromCents(taxableCents),
    epfBase: fromCents(epfBaseCents),
    socsoBase: fromCents(socsoBaseCents),
    epfEmployee: fromCents(epfEmployeeCents),
    epfEmployer: fromCents(epfEmployerCents),
    socsoEmployee: fromCents(socsoEmployeeCents),
    socsoEmployer: fromCents(socsoEmployerCents),
    eisEmployee: fromCents(eisEmployeeCents),
    eisEmployer: fromCents(eisEmployerCents),
    zakat: fromCents(zakatCents),
    pcb: fromCents(pcbCents),
    hrdfEmployer: fromCents(hrdfEmployerCents),
    totalEmployeeDeductions: fromCents(totalEmployeeDeductionsCents),
    totalEmployerCost: fromCents(totalEmployerCostCents),
    netPay: fromCents(netPayCents),
  };
}
