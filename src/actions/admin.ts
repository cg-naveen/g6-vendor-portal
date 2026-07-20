"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/currentUser";
import { createInvoiceSubmission, regenerateInvoicePdf } from "@/lib/invoice";
import { taskSubmissionSchema } from "@/lib/validation";

export type FormState = {
  error?: string;
  success?: boolean;
};

const accountTypeSchema = z.enum(["BUSINESS", "FREELANCER", "CONTRACT_FREELANCER"]);

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
