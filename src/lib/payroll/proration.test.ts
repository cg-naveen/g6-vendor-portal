import { describe, expect, it } from "vitest";
import { toCents } from "./money";
import { prorateSalaryForMonth } from "./proration";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** March 2026 has 31 days, and 3100 / 31 = 100 exactly — handy for clean assertions. */
const march = { year: 2026, month: 3 };
const from1st = [{ monthlySalary: 3100, effectiveFrom: utc("2026-03-01") }];

describe("prorateSalaryForMonth — whole months", () => {
  it("pays the full salary for a full month", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(3100);
    expect(result.proratedDays).toBe(31);
    expect(result.daysInMonth).toBe(31);
  });

  it("uses 28 days for a non-leap February", () => {
    const result = prorateSalaryForMonth({
      year: 2026,
      month: 2,
      salaryRecords: [{ monthlySalary: 2800, effectiveFrom: utc("2026-01-01") }],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.daysInMonth).toBe(28);
    expect(result.amount).toBe(2800);
  });

  it("uses 29 days for a leap February", () => {
    const result = prorateSalaryForMonth({
      year: 2028,
      month: 2,
      salaryRecords: [{ monthlySalary: 2900, effectiveFrom: utc("2020-01-01") }],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.daysInMonth).toBe(29);
    expect(result.amount).toBe(2900);
  });
});

describe("prorateSalaryForMonth — partial months", () => {
  it("prorates a mid-month joiner from the hire date", () => {
    // Employed 16-31 March = 16 days at 100/day
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(1600);
    expect(result.proratedDays).toBe(16);
  });

  it("prorates a mid-month leaver up to and including the end date", () => {
    // Employed 1-15 March = 15 days
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
      endedOn: utc("2026-03-15"),
    });

    expect(result.amount).toBe(1500);
    expect(result.proratedDays).toBe(15);
  });

  it("handles joining and leaving within the same month", () => {
    // Employed 10-20 March inclusive = 11 days
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-03-10"),
      endedOn: utc("2026-03-20"),
    });

    expect(result.amount).toBe(1100);
    expect(result.proratedDays).toBe(11);
  });
});

describe("prorateSalaryForMonth — salary changes", () => {
  it("splits the month across a mid-month increment", () => {
    // 1-20 March at 3100 (100/day) = 2000; 21-31 at 6200 (200/day) = 2200
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4200);
    expect(result.proratedDays).toBe(31);
  });

  it("handles two increments in one month", () => {
    // 1-20 at 100/day = 2000; 21-25 at 200/day = 1000; 26-31 at 300/day = 1800
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
        { monthlySalary: 9300, effectiveFrom: utc("2026-03-26") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4800);
  });

  it("resolves by month, not by wall clock — a future increment is ignored", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 9300, effectiveFrom: utc("2026-05-01") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(3100);
  });

  it("uses a record that predates the hire date, from the hire date onward", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 3100, effectiveFrom: utc("2025-06-01") }],
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(1600);
  });

  it("accepts records in any order", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4200);
  });
});

describe("prorateSalaryForMonth — nothing to pay", () => {
  it("pays nothing when no salary record is yet effective", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 3100, effectiveFrom: utc("2026-06-01") }],
      hiredOn: utc("2026-01-01"),
    });

    expect(result.amount).toBe(0);
    expect(result.proratedDays).toBe(0);
  });

  it("pays nothing when the employee had not yet joined", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-07-01"),
    });

    expect(result.amount).toBe(0);
  });

  it("pays nothing when the employee had already left", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
      endedOn: utc("2026-01-31"),
    });

    expect(result.amount).toBe(0);
  });

  it("pays nothing with no salary records at all", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(0);
  });
});

describe("prorateSalaryForMonth — rounding", () => {
  it("rounds once at the end rather than once per day", () => {
    // 5000 / 31 = 16129.032... sen per day. Sixteen days is 258064.516 sen,
    // which rounds to 2580.65. Rounding each day first would give 2580.64.
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 5000, effectiveFrom: utc("2026-03-01") }],
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(2580.65);
  });

  it("always returns a sen-exact amount", () => {
    for (let day = 1; day <= 31; day++) {
      const result = prorateSalaryForMonth({
        ...march,
        salaryRecords: [{ monthlySalary: 5333.33, effectiveFrom: utc("2026-03-01") }],
        hiredOn: new Date(Date.UTC(2026, 2, day)),
      });
      expect(Number.isInteger(toCents(result.amount))).toBe(true);
    }
  });
});
