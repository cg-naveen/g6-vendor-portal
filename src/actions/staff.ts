"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { parseDateInput } from "@/lib/billingDates";
import { requireAdmin, requireStaff } from "@/lib/currentUser";
import { generateEmployeeCode } from "@/lib/employeeCode";
import {
  employeeSchema,
  employeeUpdateSchema,
  employmentStatusSchema,
  salaryRecordSchema,
} from "@/lib/payrollValidation";
import { prisma } from "@/lib/prisma";

export type FormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Blank means "fall back to the statutory rate", which is null, not zero. */
const optionalDecimal = (value: string | undefined) =>
  value && value.trim() !== "" ? Number(value) : null;

/** The employee columns shared by create and update. */
function employeeData(d: z.infer<typeof employeeUpdateSchema>) {
  return {
    fullName: d.fullName,
    designation: d.designation,
    department: d.department || null,
    nationality: d.nationality || null,
    gender: d.gender || null,
    nricOrPassport: d.nricOrPassport,
    epfNumber: d.epfNumber || null,
    socsoNumber: d.socsoNumber || null,
    pcbNumber: d.pcbNumber || null,
    email: d.email,
    phone: d.phone,
    addressLine1: d.addressLine1 || null,
    addressLine2: d.addressLine2 || null,
    city: d.city || null,
    postcode: d.postcode || null,
    state: d.state || null,
    country: d.country || null,
    bankName: d.bankName,
    accountNumber: d.accountNumber,
    accountHolderName: d.accountHolderName || null,
    hiredOn: parseDateInput(d.hiredOn),
    epfEnabled: d.epfEnabled,
    socsoEnabled: d.socsoEnabled,
    eisEnabled: d.eisEnabled,
    epfEmployeeRateOverride: optionalDecimal(d.epfEmployeeRateOverride),
    epfEmployerRateOverride: optionalDecimal(d.epfEmployerRateOverride),
    monthlyZakat: optionalDecimal(d.monthlyZakat),
    taxResident: d.taxResident,
    taxWorkerCategory: d.taxWorkerCategory || null,
    taxMaritalStatus: d.taxMaritalStatus || null,
    taxDependents: d.taxDependents,
  };
}

export async function createEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = employeeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists.", fieldErrors: { email: "Email already registered" } };
  }

  const passwordHash = await hashPassword(d.password);
  const employeeCode = await generateEmployeeCode();

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: d.email.toLowerCase(), passwordHash, role: "STAFF" },
    });

    return tx.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        ...employeeData(d),
        // The first SalaryRecord starts the timeline, effective from the hire date.
        salaryRecords: {
          create: [
            {
              monthlySalary: d.monthlySalary,
              effectiveFrom: parseDateInput(d.hiredOn),
              reason: "Starting salary",
            },
          ],
        },
      },
    });
  });

  revalidatePath("/admin/staff");
  redirect(`/admin/staff/${employee.id}`);
}

export async function updateEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = employeeUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  await prisma.employee.update({ where: { id: employeeId }, data: employeeData(parsed.data) });

  revalidatePath(`/admin/staff/${employeeId}`);
  redirect(`/admin/staff/${employeeId}`);
}

export async function setEmploymentStatus(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = employmentStatusSchema.safeParse({
    status: formData.get("status"),
    endedOn: formData.get("endedOn") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status." };
  }

  const { status, endedOn } = parsed.data;
  if (status !== "ACTIVE" && !endedOn) {
    return { error: "An end date is required when an employee resigns or is terminated." };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      status,
      // Clearing endedOn on re-activation matters: proration and run generation
      // both read it, and a stale date would silently exclude the employee.
      endedOn: status === "ACTIVE" ? null : parseDateInput(endedOn!),
    },
  });

  revalidatePath(`/admin/staff/${employeeId}`);
  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Appends to the salary timeline. Never edits an existing record: a raise is a
 * new effective-dated row, so history stays intact and already-finalized months
 * keep resolving to the salary they were actually paid at.
 */
export async function recordSalaryChange(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = salaryRecordSchema.safeParse({
    monthlySalary: formData.get("monthlySalary"),
    effectiveFrom: formData.get("effectiveFrom"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const effectiveFrom = parseDateInput(parsed.data.effectiveFrom);

  const clash = await prisma.salaryRecord.findFirst({ where: { employeeId, effectiveFrom } });
  if (clash) {
    return {
      error: "A salary record already starts on that date.",
      fieldErrors: { effectiveFrom: "Pick a different effective date" },
    };
  }

  await prisma.salaryRecord.create({
    data: {
      employeeId,
      monthlySalary: parsed.data.monthlySalary,
      effectiveFrom,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath(`/admin/staff/${employeeId}`);
  return { success: true };
}

/** Staff self-service: contact and bank details only. Never statutory fields. */
export async function staffUpdateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const employee = await requireStaff();

  const schema = z.object({
    phone: z.string().trim().min(1, "Phone number is required"),
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postcode: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    bankName: z.string().trim().min(1, "Bank name is required"),
    accountNumber: z.string().trim().min(1, "Account number is required"),
    accountHolderName: z.string().trim().optional(),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const d = parsed.data;
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      phone: d.phone,
      addressLine1: d.addressLine1 || null,
      addressLine2: d.addressLine2 || null,
      city: d.city || null,
      postcode: d.postcode || null,
      state: d.state || null,
      country: d.country || null,
      bankName: d.bankName,
      accountNumber: d.accountNumber,
      accountHolderName: d.accountHolderName || null,
    },
  });

  revalidatePath("/staff/profile");
  return { success: true };
}

/** Mirrors changeVendorPassword in src/actions/profile.ts. */
export async function changeStaffPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const employee = await requireStaff();

  const schema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: employee.userId } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { success: true };
}
