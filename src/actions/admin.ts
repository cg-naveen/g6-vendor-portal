"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/currentUser";
import { createInvoiceSubmission, regenerateInvoicePdf } from "@/lib/invoice";
import { taskSubmissionSchema, adminCreateVendorSchema, adminEditVendorSchema } from "@/lib/validation";
import { runDueRecurringBilling } from "@/lib/recurringBilling";
import { hashPassword } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

export type FormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

const accountTypeSchema = z.enum(["BUSINESS", "FREELANCER", "CONTRACT_FREELANCER"]);

export async function createVendorManually(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const parsed = adminCreateVendorSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.vendorEmail.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists.", fieldErrors: { vendorEmail: "Email already registered" } };
  }

  const passwordHash = await hashPassword(data.password);

  const vendor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: data.vendorEmail.toLowerCase(), passwordHash, role: "VENDOR" },
    });

    return tx.vendor.create({
      data: {
        userId: user.id,
        type: data.type,
        status: "APPROVED",
        accountType: data.accountType,
        createdByAdmin: true,
        approvedAt: new Date(),
        vendorEmail: data.vendorEmail,
        phone: data.phone,
        country: data.country,
        city: data.city,
        state: data.state,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc || null,
        swift: data.swift,
        bankAddress: data.bankAddress,
        ...(data.type === "BUSINESS"
          ? {
              companyName: data.companyName,
              companyRegNumber: data.companyRegNumber || null,
              businessAddress: data.businessAddress,
              contactPersonName: data.contactPersonName,
              contactPersonEmail: data.contactPersonEmail,
              contactPersonPhone: data.contactPersonPhone,
            }
          : {
              vendorName: data.vendorName,
              homeAddress: data.homeAddress,
            }),
      },
    });
  });

  revalidatePath("/admin/vendors");
  redirect(`/admin/vendors/${vendor.id}`);
}

const changeStatusSchema = z.object({
  vendorId: z.string().min(1, "Missing vendor."),
  action: z.enum(["approve", "reject", "block", "unblock", "reopen"]),
  accountType: accountTypeSchema.optional(),
  reason: z.string().trim().optional(),
});

/**
 * Single entry point for every vendor-status transition, callable inline from
 * the vendors list or the detail page (it revalidates rather than redirects, so
 * it works from anywhere). Approve requires an account type; the others don't.
 */
export async function changeVendorStatus(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = changeStatusSchema.safeParse({
    vendorId: formData.get("vendorId"),
    action: formData.get("action"),
    accountType: formData.get("accountType") ?? undefined,
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const { vendorId, action, accountType, reason } = parsed.data;
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return { error: "Vendor not found." };

  let data: Parameters<typeof prisma.vendor.update>[0]["data"];
  switch (action) {
    case "approve":
      if (!accountType) return { error: "Select an account type before approving." };
      data = { status: "APPROVED", accountType, approvedAt: new Date(), rejectionReason: null };
      break;
    case "reject":
      data = { status: "REJECTED", rejectionReason: reason || null };
      break;
    case "block":
      if (vendor.status !== "APPROVED") return { error: "Only approved vendors can be blocked." };
      data = { status: "BLOCKED" };
      break;
    case "unblock":
      if (vendor.status !== "BLOCKED") return { error: "This vendor is not blocked." };
      data = { status: "APPROVED" };
      break;
    case "reopen":
      data = { status: "PENDING", rejectionReason: null };
      break;
  }

  await prisma.vendor.update({ where: { id: vendorId }, data });

  revalidatePath("/admin");
  revalidatePath("/admin/vendors");
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/vendor");
  return { success: true };
}

export async function createContractDeliverable(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "This vendor is not a Contract Freelancer." };
  }

  let rows: unknown;
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { error: "Invalid deliverable rows." };
  }

  const parsed = taskSubmissionSchema.safeParse({ notes: formData.get("notes"), lineItems: rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the deliverable entries." };
  }

  await createInvoiceSubmission({
    vendor,
    source: "ADMIN",
    notes: parsed.data.notes,
    lineItems: parsed.data.lineItems.map((li) => ({
      date: new Date(li.date),
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
    })),
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  redirect(`/admin/vendors/${vendorId}`);
}

export async function updateContractDeliverable(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");
  const vendorId = String(formData.get("vendorId") ?? "");

  let rows: unknown;
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { error: "Invalid deliverable rows." };
  }

  const parsed = taskSubmissionSchema.safeParse({ notes: formData.get("notes"), lineItems: rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the deliverable entries." };
  }

  await prisma.$transaction([
    prisma.taskLineItem.deleteMany({ where: { submissionId } }),
    prisma.invoiceSubmission.update({
      where: { id: submissionId },
      data: {
        notes: parsed.data.notes || null,
        lineItems: {
          create: parsed.data.lineItems.map((li) => ({
            date: new Date(li.date),
            description: li.description,
            quantity: li.quantity,
            rate: li.rate,
            amount: li.quantity * li.rate,
          })),
        },
      },
    }),
  ]);

  await regenerateInvoicePdf(submissionId);

  revalidatePath(`/admin/vendors/${vendorId}`);
  redirect(`/admin/vendors/${vendorId}`);
}

const autoBillingSchema = z
  .object({
    autoBillingEnabled: z.boolean(),
    recurringDescription: z.string().trim().default(""),
    recurringAmount: z.string().trim().default(""),
    nextBillingDate: z.string().trim().default(""),
  })
  .superRefine((data, ctx) => {
    // Only enforce the recurring fields when auto-billing is actually turned on,
    // so an admin can disable it (or save an empty draft) without validation errors.
    if (!data.autoBillingEnabled) return;
    if (!data.recurringDescription) {
      ctx.addIssue({ code: "custom", path: ["recurringDescription"], message: "Description is required when auto-billing is enabled" });
    }
    const amount = Number(data.recurringAmount);
    if (!data.recurringAmount || Number.isNaN(amount) || amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["recurringAmount"], message: "Enter a recurring amount greater than 0" });
    }
    if (!data.nextBillingDate) {
      ctx.addIssue({ code: "custom", path: ["nextBillingDate"], message: "Next billing date is required" });
    }
  });

export async function adminUpdateVendor(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return { error: "Vendor not found." };

  const parsed = adminEditVendorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const d = parsed.data;

  if (vendor.type === "BUSINESS") {
    if (!d.companyName) return { error: "Company name is required.", fieldErrors: { companyName: "Company name is required" } };
    if (!d.businessAddress) return { error: "Business address is required.", fieldErrors: { businessAddress: "Business address is required" } };
  } else {
    if (!d.vendorName) return { error: "Vendor name is required.", fieldErrors: { vendorName: "Vendor name is required" } };
    if (!d.homeAddress) return { error: "Home address is required.", fieldErrors: { homeAddress: "Home address is required" } };
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      vendorEmail: d.vendorEmail,
      phone: d.phone,
      country: d.country,
      city: d.city,
      state: d.state,
      bankName: d.bankName,
      accountNumber: d.accountNumber,
      ifsc: d.ifsc || null,
      swift: d.swift,
      bankAddress: d.bankAddress,
      ...(vendor.type === "BUSINESS"
        ? {
            companyName: d.companyName,
            companyRegNumber: d.companyRegNumber || null,
            businessAddress: d.businessAddress,
            contactPersonName: d.contactPersonName || null,
            contactPersonEmail: d.contactPersonEmail || null,
            contactPersonPhone: d.contactPersonPhone || null,
          }
        : {
            vendorName: d.vendorName,
            homeAddress: d.homeAddress,
          }),
    },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  redirect(`/admin/vendors/${vendorId}`);
}

export async function updateContractInfo(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "This vendor is not a Contract Freelancer." };
  }

  const clean = sanitizeHtml(String(formData.get("contractInfo") ?? ""));

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { contractInfo: clean || null },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/vendor");
  return { success: true };
}

export async function updateAutoBilling(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "This vendor is not a Contract Freelancer." };
  }

  const parsed = autoBillingSchema.safeParse({
    // An unchecked checkbox is absent from FormData (null), so normalise to a boolean here.
    autoBillingEnabled: formData.get("autoBillingEnabled") === "on",
    recurringDescription: formData.get("recurringDescription") ?? "",
    recurringAmount: formData.get("recurringAmount") ?? "",
    nextBillingDate: formData.get("nextBillingDate") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the auto-billing settings." };
  }

  const { autoBillingEnabled, recurringDescription, recurringAmount, nextBillingDate } = parsed.data;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      autoBillingEnabled,
      recurringDescription: recurringDescription || null,
      recurringAmount: recurringAmount ? Number(recurringAmount) : null,
      nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
    },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  return { success: true };
}

export type RunBillingState = {
  message?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's action signature
export async function runBillingNowAction(_prevState: RunBillingState): Promise<RunBillingState> {
  await requireAdmin();
  const result = await runDueRecurringBilling();
  revalidatePath("/admin");
  revalidatePath("/admin/vendors");

  if (result.generated === 0) {
    return { message: "No contract vendors are due for billing today." };
  }
  return { message: `Generated ${result.generated} invoice(s) for: ${result.vendorNames.join(", ")}` };
}
