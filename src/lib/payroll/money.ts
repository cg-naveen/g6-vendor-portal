/**
 * Currency helpers for payroll.
 *
 * Every figure is handled as an integer number of sen internally. `5300 * 0.11`
 * evaluates to 583.0000000000001 in JavaScript, and a payslip that is off by a
 * fraction of a sen is a payslip that does not reconcile with what was actually
 * remitted to EPF, PERKESO or LHDN.
 *
 * Convention: `toCents` takes a ringgit INPUT. `pctOfCents`, `ceilToRinggit` and
 * `floorTo5Sen` operate on sen and tolerate fractional sen, because intermediate
 * products legitimately produce them (RM91.875). They always return integer sen.
 */

/** Ringgit to integer sen. Rounds half away from zero. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Integer sen back to ringgit, for display and for Prisma Decimal columns. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Applies a percentage rate to a sen amount, returning possibly-fractional sen.
 *
 * The rate is scaled to an integer thousandth-of-a-percent first so the whole
 * multiplication stays in integers and only the final division introduces a
 * fraction. A naive `cents * rate / 100` drifts for rates like 0.2, which has no
 * exact binary representation: 525000 * 0.2 === 105000.00000000001.
 */
export function pctOfCents(cents: number, ratePercent: number): number {
  const milliPercent = Math.round(ratePercent * 1000);
  return (cents * milliPercent) / 100000;
}

/**
 * Rounds up to the next whole ringgit — the EPF rule. An amount already on an
 * exact ringgit must stay put, so 58300 sen stays 58300 rather than becoming 58400.
 */
export function ceilToRinggit(cents: number): number {
  return Math.ceil(cents / 100) * 100;
}

/**
 * Floors to a 5 sen boundary — the granularity PERKESO publishes SOCSO and EIS
 * figures at. RM91.875 becomes RM91.85.
 *
 * The epsilon nudge absorbs float dust: a product that should be exactly 1050
 * can arrive as 1050.0000000000002, and a bare floor would drop it to 1045.
 */
export function floorTo5Sen(cents: number): number {
  return Math.floor(cents / 5 + 1e-9) * 5;
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
