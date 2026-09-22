import { describe, expect, it } from "vitest";
import { generateBands } from "./bands";
import { computePayslip } from "./calc";
import { toCents } from "./money";
import type { EmployeeCalcFacts, LineInput, RateConfig } from "./types";

const config: RateConfig = {
  epfEmployeeRate: 11,
  epfEmployerRate: 12,
  epfEmployerRateBelowThreshold: 13,
  epfEmployerThreshold: 5000,
  hrdfEnabled: false,
  hrdfRate: 1,
  socsoBands: generateBands({ employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 }),
  eisBands: generateBands({ employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 }),
};

const employee: EmployeeCalcFacts = {
  epfEnabled: true,
  socsoEnabled: true,
  eisEnabled: true,
  epfEmployeeRateOverride: null,
  epfEmployerRateOverride: null,
  monthlyZakat: 0,
  pcb: 0,
};

/** A fully statutory-applicable earning line, which is what basic salary is. */
function salary(amount: number): LineInput {
  return { kind: "EARNING", amount, taxable: true, epfApplicable: true, socsoApplicable: true };
}

function run(lines: LineInput[], facts: Partial<EmployeeCalcFacts> = {}, cfg: Partial<RateConfig> = {}) {
  return computePayslip({
    lines,
    employee: { ...employee, ...facts },
    config: { ...config, ...cfg },
  });
}

describe("computePayslip — the reference payslip", () => {
  it("reproduces every figure on the reference payslip exactly", () => {
    const result = run([salary(5300)], { pcb: 130.5 });

    expect(result).toEqual({
      grossPay: 5300,
      taxablePay: 5300,
      epfBase: 5300,
      socsoBase: 5300,
      epfEmployee: 583,
      epfEmployer: 636,
      socsoEmployee: 26.25,
      socsoEmployer: 91.85,
      eisEmployee: 10.5,
      eisEmployer: 10.5,
      zakat: 0,
      pcb: 130.5,
      hrdfEmployer: 0,
      totalEmployeeDeductions: 750.25,
      netPay: 4549.75,
      totalEmployerCost: 6038.35,
    });
  });
});

describe("computePayslip — EPF", () => {
  it("uses the 13% employer rate at or below the threshold", () => {
    const result = run([salary(4500)]);
    expect(result.epfEmployee).toBe(495);
    expect(result.epfEmployer).toBe(585);
  });

  it("uses 13% at exactly the threshold", () => {
    expect(run([salary(5000)]).epfEmployer).toBe(650);
  });

  it("switches to 12% one sen above the threshold", () => {
    // 500001 sen x 12% = 60000.12 sen, rounded up to the next ringgit = 601.00
    expect(run([salary(5000.01)]).epfEmployer).toBe(601);
  });

  it("rounds the contribution up to the next ringgit", () => {
    // 100050 sen x 11% = 11005.5 sen -> 111.00
    expect(run([salary(1000.5)]).epfEmployee).toBe(111);
  });

  it("honours a per-employee rate override", () => {
    const result = run([salary(5300)], { epfEmployeeRateOverride: 15 });
    expect(result.epfEmployee).toBe(795);
    expect(result.epfEmployer).toBe(636);
  });

  it("zeroes EPF when disabled, leaving the other deductions alone", () => {
    const result = run([salary(5300)], { epfEnabled: false });
    expect(result.epfEmployee).toBe(0);
    expect(result.epfEmployer).toBe(0);
    expect(result.socsoEmployee).toBe(26.25);
    expect(result.eisEmployee).toBe(10.5);
  });
});

describe("computePayslip — line flags", () => {
  it("excludes a non-EPF-able earning from the EPF base but not from gross", () => {
    const allowance: LineInput = {
      kind: "EARNING",
      amount: 500,
      taxable: true,
      epfApplicable: false,
      socsoApplicable: true,
    };
    const result = run([salary(5300), allowance]);

    expect(result.grossPay).toBe(5800);
    expect(result.epfBase).toBe(5300);
    expect(result.socsoBase).toBe(5800);
    expect(result.epfEmployee).toBe(583);
  });

  it("separates taxable pay from gross pay for a non-taxable earning", () => {
    const reimbursement: LineInput = {
      kind: "EARNING",
      amount: 250,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    const result = run([salary(5300), reimbursement]);

    expect(result.grossPay).toBe(5550);
    expect(result.taxablePay).toBe(5300);
    expect(result.epfBase).toBe(5300);
  });
});

describe("computePayslip — the two deduction kinds", () => {
  it("reduces gross and every flagged base for a WAGE_DEDUCTION", () => {
    const unpaidLeave: LineInput = {
      kind: "WAGE_DEDUCTION",
      amount: 300,
      taxable: true,
      epfApplicable: true,
      socsoApplicable: true,
    };
    const result = run([salary(5300), unpaidLeave]);

    expect(result.grossPay).toBe(5000);
    expect(result.taxablePay).toBe(5000);
    expect(result.epfBase).toBe(5000);
    expect(result.socsoBase).toBe(5000);
    // The lower base now attracts the 13% employer rate, not 12%
    expect(result.epfEmployer).toBe(650);
  });

  it("leaves every base untouched for a NET_DEDUCTION and only reduces net", () => {
    // THE most important assertion in this suite. Treating a loan repayment as
    // a wage reduction would lower the EPF and SOCSO bases and under-remit.
    const loanRepayment: LineInput = {
      kind: "NET_DEDUCTION",
      amount: 300,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    const withLoan = run([salary(5300), loanRepayment], { pcb: 130.5 });
    const without = run([salary(5300)], { pcb: 130.5 });

    expect(withLoan.grossPay).toBe(5300);
    expect(withLoan.epfBase).toBe(5300);
    expect(withLoan.socsoBase).toBe(5300);
    expect(withLoan.epfEmployee).toBe(without.epfEmployee);
    expect(withLoan.socsoEmployee).toBe(without.socsoEmployee);

    expect(withLoan.totalEmployeeDeductions).toBe(1050.25);
    expect(withLoan.netPay).toBe(4249.75);
  });
});

describe("computePayslip — SOCSO and EIS", () => {
  it("clamps to the highest band above the wage ceiling", () => {
    // Band 5900-6000, midpoint 5950: employee 29.75, employer 104.10
    const result = run([salary(8000)]);
    expect(result.socsoEmployee).toBe(29.75);
    expect(result.socsoEmployer).toBe(104.1);
  });

  it("zeroes SOCSO when disabled while still computing EIS", () => {
    const result = run([salary(5300)], { socsoEnabled: false });
    expect(result.socsoEmployee).toBe(0);
    expect(result.socsoEmployer).toBe(0);
    expect(result.eisEmployee).toBe(10.5);
  });

  it("zeroes EIS when disabled while still computing SOCSO", () => {
    const result = run([salary(5300)], { eisEnabled: false });
    expect(result.eisEmployee).toBe(0);
    expect(result.socsoEmployee).toBe(26.25);
  });
});

describe("computePayslip — zakat, PCB and HRDF", () => {
  it("deducts elected zakat from net without touching any base", () => {
    const result = run([salary(5300)], { monthlyZakat: 100 });
    expect(result.zakat).toBe(100);
    expect(result.epfBase).toBe(5300);
    expect(result.netPay).toBe(4580.25);
  });

  it("charges HRDF to the employer only", () => {
    const result = run([salary(5300)], { pcb: 130.5 }, { hrdfEnabled: true });
    expect(result.hrdfEmployer).toBe(53);
    expect(result.netPay).toBe(4549.75);
    expect(result.totalEmployerCost).toBe(6091.35);
  });
});

describe("computePayslip — edge cases", () => {
  it("returns all zeroes for an empty payslip without crashing", () => {
    const result = run([]);
    expect(result.grossPay).toBe(0);
    expect(result.epfEmployee).toBe(0);
    expect(result.socsoEmployee).toBe(0);
    expect(result.netPay).toBe(0);
  });

  it("reports a negative net when deductions exceed pay", () => {
    // The engine computes it honestly; finalize refuses to issue it (Task 13).
    const advance: LineInput = {
      kind: "NET_DEDUCTION",
      amount: 6000,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    expect(run([salary(5300), advance]).netPay).toBeLessThan(0);
  });

  it("produces figures exact to the sen for an awkward salary", () => {
    const result = run([salary(3333.33)], { pcb: 47.15 });
    for (const [field, value] of Object.entries(result)) {
      expect(Number.isInteger(toCents(value)), `${field} = ${value} is not sen-exact`).toBe(true);
    }
    expect(result.netPay).toBeCloseTo(
      result.grossPay - result.totalEmployeeDeductions,
      10
    );
  });
});
