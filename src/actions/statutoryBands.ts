"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/currentUser";
import { generateBands } from "@/lib/payroll/bands";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; success?: boolean; message?: string };

const bandType = z.enum(["SOCSO", "EIS"]);

/**
 * Rebuilds the GENERATED rows for one table from the configured rates.
 *
 * MANUAL rows are left alone: once an admin has corrected a band against the
 * official schedule, a later regeneration must not silently undo that. It also
 * clears the verification stamp, because the table has changed and whatever was
 * verified before no longer describes it.
 */
export async function regenerateBandsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = bandType.safeParse(formData.get("type"));
  if (!parsed.success) return { error: "Unknown band table." };
  const type = parsed.data;

  const settings = await getPayrollSettings();
  const bands = generateBands(
    type === "SOCSO"
      ? {
          employeeRate: Number(settings.socsoEmployeeRate),
          employerRate: Number(settings.socsoEmployerRate),
          wageCeiling: Number(settings.socsoWageCeiling),
          bandWidth: Number(settings.socsoBandWidth),
        }
      : {
          employeeRate: Number(settings.eisEmployeeRate),
          employerRate: Number(settings.eisEmployerRate),
          wageCeiling: Number(settings.eisWageCeiling),
          bandWidth: Number(settings.eisBandWidth),
        },
  );

  const manual = await prisma.statutoryBand.findMany({
    where: { type, source: "MANUAL" },
    select: { wageFrom: true },
  });
  const keep = new Set(manual.map((row) => Number(row.wageFrom)));
  const generatedBands = bands.filter((band) => !keep.has(band.wageFrom));

  await prisma.$transaction([
    prisma.statutoryBand.deleteMany({ where: { type, source: "GENERATED" } }),
    prisma.statutoryBand.createMany({
      data: generatedBands.map((band) => ({ type, ...band, source: "GENERATED" as const })),
    }),
    prisma.payrollSettings.update({
      where: { id: "singleton" },
      data: { bandsGeneratedAt: new Date(), bandsVerifiedAt: null, bandsVerifiedBy: null },
    }),
  ]);

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return {
    success: true,
    message: `Regenerated ${generatedBands.length} ${type} band(s). ${manual.length} manually-edited band(s) kept.`,
  };
}

/** Editing a band flips it to MANUAL so regeneration will not overwrite it. */
export async function updateBandAction(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().min(1),
      employeeAmount: z.coerce.number().min(0, "Amount cannot be negative"),
      employerAmount: z.coerce.number().min(0, "Amount cannot be negative"),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid band." };

  await prisma.$transaction([
    prisma.statutoryBand.update({
      where: { id: parsed.data.id },
      data: {
        employeeAmount: parsed.data.employeeAmount,
        employerAmount: parsed.data.employerAmount,
        source: "MANUAL",
      },
    }),
    prisma.payrollSettings.update({
      where: { id: "singleton" },
      data: { bandsVerifiedAt: null, bandsVerifiedBy: null },
    }),
  ]);

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return { success: true };
}

/**
 * Replaces a whole table from pasted CSV, so the official PERKESO schedule can
 * be transcribed wholesale rather than edited row by row. Imported rows land as
 * MANUAL — they came from the authority, not from our rule.
 *
 * Expected columns: wageFrom,wageTo,employeeAmount,employerAmount
 * A header row is detected and skipped.
 */
export async function importBandsCsvAction(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const typeParsed = bandType.safeParse(formData.get("type"));
  if (!typeParsed.success) return { error: "Unknown band table." };
  const type = typeParsed.data;

  const csv = String(formData.get("csv") ?? "").trim();
  if (!csv) return { error: "Paste the CSV rows first." };

  const rows: { wageFrom: number; wageTo: number; employeeAmount: number; employerAmount: number }[] = [];

  for (const [index, rawLine] of csv.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;

    const cells = line.split(",").map((cell) => cell.trim().replace(/[",]/g, ""));
    if (cells.length < 4) return { error: `Line ${index + 1} has fewer than four columns.` };

    const values = cells.slice(0, 4).map(Number);
    if (index === 0 && values.some((value) => Number.isNaN(value))) continue;
    if (values.some((value) => Number.isNaN(value))) {
      return { error: `Line ${index + 1} contains a value that is not a number.` };
    }

    const [wageFrom, wageTo, employeeAmount, employerAmount] = values;
    if (wageTo <= wageFrom) return { error: `Line ${index + 1}: wageTo must be greater than wageFrom.` };
    rows.push({ wageFrom, wageTo, employeeAmount, employerAmount });
  }

  if (rows.length === 0) return { error: "No usable rows found." };

  const duplicate = rows.length !== new Set(rows.map((row) => row.wageFrom)).size;
  if (duplicate) return { error: "Two rows share the same wageFrom." };

  await prisma.$transaction([
    prisma.statutoryBand.deleteMany({ where: { type } }),
    prisma.statutoryBand.createMany({
      data: rows.map((row) => ({ type, ...row, source: "MANUAL" as const })),
    }),
    prisma.payrollSettings.update({
      where: { id: "singleton" },
      data: { bandsVerifiedAt: null, bandsVerifiedBy: null },
    }),
  ]);

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return { success: true, message: `Imported ${rows.length} ${type} band(s).` };
}

/** Records that an admin has reconciled both tables against the official schedule. */
export async function verifyBandsAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  if (formData.get("confirmed") !== "on") {
    return { error: "Tick the confirmation first." };
  }

  await prisma.payrollSettings.update({
    where: { id: "singleton" },
    data: { bandsVerifiedAt: new Date(), bandsVerifiedBy: admin.email },
  });

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return { success: true, message: "Bands marked as verified." };
}
