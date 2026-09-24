import { describe, expect, it } from "vitest";
import { findBand, generateBands } from "./bands";
import type { Band } from "./types";

const SOCSO = { employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 };
const EIS = { employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 };

describe("generateBands", () => {
  it("produces one band per bandWidth up to the ceiling", () => {
    expect(generateBands(SOCSO)).toHaveLength(60);
  });

  it("covers wages as half-open intervals starting at zero", () => {
    const [first, second] = generateBands(SOCSO);
    expect(first.wageFrom).toBe(0);
    expect(first.wageTo).toBe(100);
    expect(second.wageFrom).toBe(100);
    expect(second.wageTo).toBe(200);
  });

  it("ends exactly on the ceiling", () => {
    const bands = generateBands(SOCSO);
    expect(bands[bands.length - 1].wageTo).toBe(6000);
  });

  it("reproduces the reference payslip's SOCSO figures from the band midpoint", () => {
    // The reference employee earns 5300, which falls in the 5200-5300 band,
    // midpoint 5250. Employee 5250 x 0.5% = 26.25; employer 5250 x 1.75% =
    // 91.875 floored to 5 sen = 91.85. Using the band CEILING would give 26.50.
    const band = findBand(generateBands(SOCSO), 5300);
    expect(band?.wageFrom).toBe(5200);
    expect(band?.wageTo).toBe(5300);
    expect(band?.employeeAmount).toBe(26.25);
    expect(band?.employerAmount).toBe(91.85);
  });

  it("reproduces the reference payslip's EIS figures", () => {
    const band = findBand(generateBands(EIS), 5300);
    expect(band?.employeeAmount).toBe(10.5);
    expect(band?.employerAmount).toBe(10.5);
  });

  it("never emits a negative or NaN amount", () => {
    for (const band of generateBands(SOCSO)) {
      expect(band.employeeAmount).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(band.employeeAmount)).toBe(true);
      expect(Number.isFinite(band.employerAmount)).toBe(true);
    }
  });
});

describe("findBand", () => {
  const bands = generateBands(SOCSO);

  it("treats the lower bound as exclusive and the upper as inclusive", () => {
    expect(findBand(bands, 100)?.wageFrom).toBe(0);
    expect(findBand(bands, 100.01)?.wageFrom).toBe(100);
  });

  it("clamps to the highest band above the wage ceiling", () => {
    // A miss must NOT return null here — returning nothing would silently zero
    // the contribution for every high earner.
    const band = findBand(bands, 25000);
    expect(band?.wageFrom).toBe(5900);
    expect(band?.wageTo).toBe(6000);
  });

  it("returns the ceiling band for a wage exactly at the ceiling", () => {
    expect(findBand(bands, 6000)?.wageTo).toBe(6000);
  });

  it("returns null for a non-positive wage", () => {
    expect(findBand(bands, 0)).toBeNull();
    expect(findBand(bands, -50)).toBeNull();
  });

  it("returns null for an empty table", () => {
    expect(findBand([], 5300)).toBeNull();
  });

  it("works on a hand-edited table whose rows are out of order", () => {
    // Admins may edit bands by hand, and a CSV import makes no ordering promise.
    const shuffled: Band[] = [
      { wageFrom: 200, wageTo: 300, employeeAmount: 1.25, employerAmount: 4.35 },
      { wageFrom: 0, wageTo: 100, employeeAmount: 0.25, employerAmount: 0.85 },
      { wageFrom: 100, wageTo: 200, employeeAmount: 0.75, employerAmount: 2.6 },
    ];
    expect(findBand(shuffled, 150)?.wageFrom).toBe(100);
    expect(findBand(shuffled, 999)?.wageFrom).toBe(200);
  });
});
