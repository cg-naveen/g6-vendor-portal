import { floorTo5Sen, fromCents, pctOfCents, toCents } from "./money";
import type { Band } from "./types";

/**
 * Generates a SOCSO or EIS contribution table from configured rates.
 *
 * SOCSO and EIS are published by PERKESO as wage-band tables, not as
 * percentages applied to salary: the statutory figure is derived from the
 * band's MIDPOINT. For the 5200-5300 band the midpoint is 5250, giving an
 * employee contribution of 26.25 rather than the 26.50 that 0.5% of 5300 would
 * suggest. This midpoint rule was confirmed against all three statutory figures
 * on the reference payslip.
 *
 * The result is a starting point, not an authority — see the spec's section 12.
 * Generated rows are stored with source GENERATED so an admin's hand-corrected
 * rows survive regeneration.
 */
export function generateBands(params: {
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  bandWidth: number;
}): Band[] {
  const { employeeRate, employerRate, wageCeiling, bandWidth } = params;
  if (bandWidth <= 0 || wageCeiling <= 0) return [];

  const bands: Band[] = [];
  for (let from = 0; from < wageCeiling; from += bandWidth) {
    const to = Math.min(from + bandWidth, wageCeiling);
    const midpointCents = toCents(from + (to - from) / 2);
    bands.push({
      wageFrom: from,
      wageTo: to,
      employeeAmount: fromCents(floorTo5Sen(pctOfCents(midpointCents, employeeRate))),
      employerAmount: fromCents(floorTo5Sen(pctOfCents(midpointCents, employerRate))),
    });
  }
  return bands;
}

/**
 * Finds the band a wage falls into, treating each band as (wageFrom, wageTo].
 *
 * A wage above the highest band CLAMPS to that band rather than missing. This is
 * how the SOCSO and EIS wage ceilings behave, and a miss returning null would
 * silently zero the contribution for every employee above the ceiling — a
 * failure that produces a plausible-looking payslip.
 *
 * Bands are not assumed to be sorted: they are admin-editable and may arrive
 * from a CSV import in any order.
 */
export function findBand(bands: Band[], wage: number): Band | null {
  if (bands.length === 0 || wage <= 0) return null;

  const match = bands.find((band) => wage > band.wageFrom && wage <= band.wageTo);
  if (match) return match;

  return bands.reduce((highest, band) => (band.wageTo > highest.wageTo ? band : highest));
}
