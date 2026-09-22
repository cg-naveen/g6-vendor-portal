"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

export type FormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

const SINGLETON = { id: "singleton" };

async function saveSettings(data: Record<string, unknown>) {
  await prisma.payrollSettings.upsert({
    where: SINGLETON,
    create: { ...SINGLETON, ...data },
    update: data,
  });
  revalidatePath("/admin/payroll-settings");
}

export async function updateEmployerDetailsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      employeeCodePrefix: z.string().trim().min(1, "Employee code prefix is required"),
      businessRegNumber: z.string().trim().optional(),
      epfEmployerNumber: z.string().trim().optional(),
      socsoEmployerNumber: z.string().trim().optional(),
      lhdnEmployerNumber: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the employer details." };
  }

  const data = parsed.data;
  await saveSettings({
    employeeCodePrefix: data.employeeCodePrefix,
    businessRegNumber: data.businessRegNumber || null,
    epfEmployerNumber: data.epfEmployerNumber || null,
    socsoEmployerNumber: data.socsoEmployerNumber || null,
    lhdnEmployerNumber: data.lhdnEmployerNumber || null,
  });
  return { success: true };
}

const rate = (label: string, max = 100) =>
  z.coerce.number().min(0, `${label} cannot be negative`).max(max, `${label} looks too high`);

export async function updateRatesAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      epfEmployeeRate: rate("EPF employee rate"),
      epfEmployerRate: rate("EPF employer rate"),
      epfEmployerRateBelowThreshold: rate("EPF employer rate below threshold"),
      epfEmployerThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
      socsoEmployeeRate: rate("SOCSO employee rate", 10),
      socsoEmployerRate: rate("SOCSO employer rate", 10),
      socsoWageCeiling: z.coerce.number().positive("SOCSO wage ceiling must be greater than 0"),
      socsoBandWidth: z.coerce.number().positive("SOCSO band width must be greater than 0"),
      eisEmployeeRate: rate("EIS employee rate", 10),
      eisEmployerRate: rate("EIS employer rate", 10),
      eisWageCeiling: z.coerce.number().positive("EIS wage ceiling must be greater than 0"),
      eisBandWidth: z.coerce.number().positive("EIS band width must be greater than 0"),
      hrdfEnabled: z.coerce.boolean(),
      hrdfRate: rate("HRDF rate", 10),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  // Changing SOCSO/EIS rates does not rebuild the band tables. Regeneration is
  // an explicit action because it rewrites statutory data, while finalized
  // runs must keep the rates they were issued with.
  await saveSettings(parsed.data);
  return { success: true };
}

export async function updatePayslipDesignAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      accentColor: z
        .string()
        .trim()
        .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #18181b"),
      showEmployerContributions: z.coerce.boolean(),
      showHrdfColumn: z.coerce.boolean(),
      showZakatColumn: z.coerce.boolean(),
      epfFootnote: z.string().trim().max(300).optional(),
      payslipFooterText: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the design settings." };
  }

  const logo = formData.get("payslipLogo");
  const logoUrl =
    logo instanceof File && logo.size > 0
      ? (await saveUploadedFile(logo, "payroll/logo")).url
      : undefined;

  const data = parsed.data;
  await saveSettings({
    accentColor: data.accentColor,
    showEmployerContributions: data.showEmployerContributions,
    showHrdfColumn: data.showHrdfColumn,
    showZakatColumn: data.showZakatColumn,
    epfFootnote: data.epfFootnote || null,
    payslipFooterText: data.payslipFooterText || null,
    ...(logoUrl ? { payslipLogoUrl: logoUrl } : {}),
  });
  return { success: true };
}
