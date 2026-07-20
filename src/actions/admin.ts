"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/currentUser";
import { createInvoiceSubmission, regenerateInvoicePdf } from "@/lib/invoice";
import { taskSubmissionSchema, adminCreateVendorSchema } from "@/lib/validation";
import { runDueRecurringBilling } from "@/lib/recurringBilling";
import { hashPassword } from "@/lib/auth";

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

export async function approveVendor(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const parsed = accountTypeSchema.safeParse(formData.get("accountType"));
  if (!vendorId || !parsed.success) {
    return { error: "Please select an account type before approving." };
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: "APPROVED", accountType: parsed.data, approvedAt: new Date(), rejectionReason: null },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
  redirect(`/admin/vendors/${vendorId}`);
}

export async function rejectVendor(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!vendorId) return { error: "Missing vendor." };

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: "REJECTED", rejectionReason: reason || null },
  });

  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin");
  redirect(`/admin/vendors/${vendorId}`);
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

const autoBillingSchema = z.object({
  autoBillingEnabled: z.literal("on").optional(),
  recurringDescription: z.string().trim().min(1, "Description is required"),
  recurringAmount: z.coerce.number().positive("Amount must be greater than 0"),
  nextBillingDate: z.string().min(1, "Next billing date is required"),
});

export async function updateAutoBilling(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "This vendor is not a Contract Freelancer." };
  }

  const parsed = autoBillingSchema.safeParse({
    autoBillingEnabled: formData.get("autoBillingEnabled"),
    recurringDescription: formData.get("recurringDescription"),
    recurringAmount: formData.get("recurringAmount"),
    nextBillingDate: formData.get("nextBillingDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the auto-billing settings." };
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      autoBillingEnabled: parsed.data.autoBillingEnabled === "on",
      recurringDescription: parsed.data.recurringDescription,
      recurringAmount: parsed.data.recurringAmount,
      nextBillingDate: new Date(parsed.data.nextBillingDate),
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
