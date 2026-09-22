/**
 * Prints the INSERT statements that seed the SOCSO and EIS band tables.
 *
 * Run this rather than hand-typing figures: it calls the same generateBands
 * the calculation engine calls, so the seeded rows and the engine cannot
 * disagree. Re-run it and create a new migration whenever PERKESO revises the
 * rates or the wage ceiling.
 *
 *   npx tsx scripts/generate-band-sql.ts > /tmp/bands.sql
 */
import { generateBands } from "../src/lib/payroll/bands";

const SOCSO = { employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 };
const EIS = { employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 };

function emit(type: "SOCSO" | "EIS", params: typeof SOCSO) {
  const rows = generateBands(params).map(
    (band) =>
      `  ('${type.toLowerCase()}_${band.wageFrom}', '${type}', ${band.wageFrom.toFixed(2)}, ` +
      `${band.wageTo.toFixed(2)}, ${band.employeeAmount.toFixed(2)}, ` +
      `${band.employerAmount.toFixed(2)}, 'GENERATED')`
  );

  console.log(
    `-- ${type}: ${rows.length} bands, ${params.bandWidth} wide, ceiling ${params.wageCeiling}\n` +
      `-- Generated from ${params.employeeRate}% employee / ${params.employerRate}% employer\n` +
      `-- by scripts/generate-band-sql.ts. Rule: band midpoint x rate, floored to 5 sen.\n` +
      `INSERT INTO "StatutoryBand" ("id", "type", "wageFrom", "wageTo", "employeeAmount", "employerAmount", "source") VALUES\n` +
      rows.join(",\n") +
      ";\n"
  );
}

emit("SOCSO", SOCSO);
emit("EIS", EIS);
