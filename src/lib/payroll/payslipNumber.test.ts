import { describe, expect, it } from "vitest";
import { formatEmployeeCode, formatPayslipNumber } from "./payslipNumber";

describe("formatPayslipNumber", () => {
  it("builds PS-{YYYY}-{MM}-{employeeCode}", () => {
    expect(formatPayslipNumber(2024, 11, "G6-EMP-009")).toBe("PS-2024-11-G6-EMP-009");
  });

  it("zero-pads a single-digit month", () => {
    expect(formatPayslipNumber(2026, 3, "G6-EMP-001")).toBe("PS-2026-03-G6-EMP-001");
  });

  it("does not pad December", () => {
    expect(formatPayslipNumber(2026, 12, "G6-EMP-001")).toBe("PS-2026-12-G6-EMP-001");
  });
});

describe("formatEmployeeCode", () => {
  it("pads the sequence to three digits", () => {
    expect(formatEmployeeCode("G6-EMP-", 9)).toBe("G6-EMP-009");
  });

  it("leaves a three-digit sequence alone", () => {
    expect(formatEmployeeCode("G6-EMP-", 123)).toBe("G6-EMP-123");
  });

  it("does not truncate beyond three digits", () => {
    expect(formatEmployeeCode("G6-EMP-", 1234)).toBe("G6-EMP-1234");
  });

  it("respects a configured prefix", () => {
    expect(formatEmployeeCode("TS-EMP-", 9)).toBe("TS-EMP-009");
  });
});
