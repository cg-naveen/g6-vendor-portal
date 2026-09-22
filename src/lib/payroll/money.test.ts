import { describe, expect, it } from "vitest";
import { ceilToRinggit, floorTo5Sen, fromCents, pctOfCents, sumCents, toCents } from "./money";

describe("toCents", () => {
  it("converts whole ringgit", () => {
    expect(toCents(5300)).toBe(530000);
  });

  it("converts amounts that float arithmetic would mangle", () => {
    // 0.1 * 100 === 10.000000000000002 in raw JS
    expect(toCents(0.1)).toBe(10);
    expect(toCents(3333.33)).toBe(333333);
    expect(toCents(91.875)).toBe(9188);
  });

  it("round-trips through fromCents", () => {
    expect(fromCents(toCents(4549.75))).toBe(4549.75);
  });
});

describe("pctOfCents", () => {
  it("is exact for the EPF employee rate", () => {
    expect(pctOfCents(530000, 11)).toBe(58300);
  });

  it("is exact for the EPF employer rate", () => {
    expect(pctOfCents(530000, 12)).toBe(63600);
  });

  it("returns fractional sen for the SOCSO employer rate", () => {
    expect(pctOfCents(525000, 1.75)).toBe(9187.5);
  });

  it("is exact for a rate that is not representable in binary floating point", () => {
    // 0.2 cannot be represented exactly; a naive cents * 0.2 / 100 drifts.
    expect(pctOfCents(525000, 0.2)).toBe(1050);
  });

  it("is exact for the SOCSO employee rate", () => {
    expect(pctOfCents(525000, 0.5)).toBe(2625);
  });
});

describe("ceilToRinggit", () => {
  it("leaves an exact ringgit alone", () => {
    // EPF rounds UP to the next ringgit, so 583.00 must stay 583.00, not become 584.00
    expect(ceilToRinggit(58300)).toBe(58300);
  });

  it("rounds a part-ringgit up", () => {
    expect(ceilToRinggit(58190)).toBe(58200);
    expect(ceilToRinggit(58101)).toBe(58200);
  });

  it("rounds fractional sen up", () => {
    expect(ceilToRinggit(58100.5)).toBe(58200);
  });

  it("leaves zero alone", () => {
    expect(ceilToRinggit(0)).toBe(0);
  });
});

describe("floorTo5Sen", () => {
  it("floors the SOCSO employer figure from the reference payslip", () => {
    // 91.875 -> 91.85. Rounding to NEAREST 5 sen would give 91.90 and contradict
    // the reference, which is why this floors.
    expect(floorTo5Sen(9187.5)).toBe(9185);
  });

  it("leaves a figure already on a 5 sen boundary alone", () => {
    expect(floorTo5Sen(2625)).toBe(2625);
    expect(floorTo5Sen(1050)).toBe(1050);
  });

  it("absorbs the float dust left by pctOfCents-style products", () => {
    expect(floorTo5Sen(1050.0000000000002)).toBe(1050);
  });
});

describe("sumCents", () => {
  it("sums an empty list to zero", () => {
    expect(sumCents([])).toBe(0);
  });

  it("sums without drift", () => {
    expect(sumCents([58300, 2625, 1050, 13050])).toBe(75025);
  });
});
