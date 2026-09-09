"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/currentUser";
import { createInvoiceSubmission, regenerateInvoicePdf } from "@/lib/invoice";
import { deleteUploadedFile } from "@/lib/storage";
import { taskSubmissionSchema } from "@/lib/validation";

export type FormState = {
  error?: string;
};

export async function submitTaskEntries(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "FREELANCER") {
    return { error: "Only approved Freelancer vendors can submit task entries." };
  }

  const rowsRaw = formData.get("rows");
  const notes = formData.get("notes");

  let rows: unknown;
  try {
    rows = JSON.parse(String(rowsRaw ?? "[]"));
  } catch {
    return { error: "Invalid task rows submitted." };
  }

  const parsed = taskSubmissionSchema.safeParse({ notes, lineItems: rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your task entries." };
  }

  const vendorRecord = await prisma.vendor.findUniqueOrThrow({ where: { id: vendor.id } });

  await createInvoiceSubmission({
    vendor: vendorRecord,
    source: "VENDOR",
    notes: parsed.data.notes,
    lineItems: parsed.data.lineItems.map((li) => ({
      date: new Date(li.date),
      description: li.description,
      quantity: li.quantity,
      rate: li.rate,
    })),
  });

  redirect("/vendor/invoices");
}

export async function updateTaskEntries(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  const submissionId = String(formData.get("submissionId") ?? "");

  const submission = await prisma.invoiceSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.vendorId !== vendor.id) {
    return { error: "Invoice not found." };
  }
  if (submission.source !== "VENDOR" || submission.paymentStatus !== "UNPAID") {
    return { error: "This invoice can no longer be edited." };
  }

  const rowsRaw = formData.get("rows");
  const notes = formData.get("notes");

  let rows: unknown;
  try {
    rows = JSON.parse(String(rowsRaw ?? "[]"));
  } catch {
    return { error: "Invalid task rows submitted." };
  }

  const parsed = taskSubmissionSchema.safeParse({ notes, lineItems: rows });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your task entries." };
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

  redirect("/vendor/invoices");
}

export async function deleteTaskEntry(submissionId: string) {
  const vendor = await requireVendor();
  const submission = await prisma.invoiceSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.vendorId !== vendor.id) return;
  if (submission.source !== "VENDOR" || submission.paymentStatus !== "UNPAID") return;

  await prisma.invoiceSubmission.delete({ where: { id: submissionId } });
  if (submission.pdfPath?.startsWith("http")) {
    await deleteUploadedFile(submission.pdfPath).catch(() => {});
  }

  revalidatePath("/vendor/invoices");
  revalidatePath("/vendor/tasks");
}
