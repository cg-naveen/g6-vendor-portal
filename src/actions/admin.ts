"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/currentUser";
import { createInvoiceSubmission, regenerateInvoicePdf } from "@/lib/invoice";
import { taskSubmissionSchema, adminCreateVendorSchema, adminEditVendorSchema } from "@/lib/validation";
import { runDueRecurringBilling, buildAutoBillingUpdate, runRecurringBillingForVendor } from "@/lib/recurringBilling";
import { hashPassword } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";
import { generateUniqueVendorCode } from "@/lib/vendorCode";

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
  const vendorCode = await generateUniqueVendorCode();

  const vendor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: data.vendorEmail.toLowerCase(), passwordHash, role: "VENDOR" },
    });

    return tx.vendor.create({
      data: {
        userId: user.id,
        vendorCode,
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
        accountHolderName: data.accountHolderName,
        ifsc: data.ifsc || null,
        swift: data.swift,
        bankAddressLine1: data.bankAddressLine1,
        bankAddressLine2: data.bankAddressLine2 || null,
        bankCity: data.bankCity,
        bankPostcode: data.bankPostcode,
        bankState: data.bankState,
        bankCountry: data.bankCountry,
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
              homeAddressLine1: data.homeAddressLine1,
              homeAddressLine2: data.homeAddressLine2 || null,
              homeCity: data.homeCity,
              homePostcode: data.homePostcode,
              homeState: data.homeState,
              homeCountry: data.homeCountry,
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
    billingDayOfMonth: z.string().trim().default(""),
  })
  .superRefine((data, ctx) => {
    if (!data.autoBillingEnabled) return;
    if (!data.recurringDescription) {
      ctx.addIssue({ code: "custom", path: ["recurringDescription"], message: "Description is required when auto-billing is enabled" });
    }
    const amount = Number(data.recurringAmount);
    if (!data.recurringAmount || Number.isNaN(amount) || amount <= 0) {
      ctx.addIssue({ code: "custom", path: ["recurringAmount"], message: "Enter a recurring amount greater than 0" });
    }
    if (!data.nextBillingDate) {
      ctx.addIssue({ code: "custom", path: ["nextBillingDate"], message: "First billing date is required" });
    }
    const billingDay = Number(data.billingDayOfMonth);
    if (!data.billingDayOfMonth || Number.isNaN(billingDay) || billingDay < 1 || billingDay > 31) {
      ctx.addIssue({ code: "custom", path: ["billingDayOfMonth"], message: "Enter a billing day between 1 and 31" });
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
    if (!d.homeAddressLine1) return { error: "Home address is required.", fieldErrors: { homeAddressLine1: "Home address is required" } };
    if (!d.homeCity) return { error: "Home city is required.", fieldErrors: { homeCity: "Home city is required" } };
    if (!d.homePostcode) return { error: "Home postcode is required.", fieldErrors: { homePostcode: "Home postcode is required" } };
    if (!d.homeState) return { error: "Home state is required.", fieldErrors: { homeState: "Home state is required" } };
    if (!d.homeCountry) return { error: "Home country is required.", fieldErrors: { homeCountry: "Home country is required" } };
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
      accountHolderName: d.accountHolderName,
      ifsc: d.ifsc || null,
      swift: d.swift,
      bankAddressLine1: d.bankAddressLine1,
      bankAddressLine2: d.bankAddressLine2 || null,
      bankCity: d.bankCity,
      bankPostcode: d.bankPostcode,
      bankState: d.bankState,
      bankCountry: d.bankCountry,
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
            homeAddressLine1: d.homeAddressLine1,
            homeAddressLine2: d.homeAddressLine2 || null,
            homeCity: d.homeCity,
            homePostcode: d.homePostcode,
            homeState: d.homeState,
            homeCountry: d.homeCountry,
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
    autoBillingEnabled: formData.get("autoBillingEnabled") === "on",
    recurringDescription: formData.get("recurringDescription") ?? "",
    recurringAmount: formData.get("recurringAmount") ?? "",
    nextBillingDate: formData.get("nextBillingDate") ?? "",
    billingDayOfMonth: formData.get("billingDayOfMonth") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the auto-billing settings." };
  }

  const billingData = buildAutoBillingUpdate(parsed.data);

  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: billingData,
  });

  if (updated.autoBillingEnabled) {
    await runRecurringBillingForVendor(updated);
  }

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
  return { message: `Generated ${result.generated} invoice batch(es)${result.vendorNames.length ? ` for: ${result.vendorNames.join(", ")}` : ""}.` };
}
