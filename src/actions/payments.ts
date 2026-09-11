"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/currentUser";
import { markBillPaid as markBillPaidLib, markSubmissionPaid, markSubmissionUnpaid } from "@/lib/payments";

export type FormState = {
  error?: string;
};

const paymentSchema = z.object({
  amountPaid: z.coerce.number().positive("Amount paid must be greater than 0"),
  transactionFee: z.coerce.number().min(0, "Transaction fee cannot be negative"),
});

export async function markBillPaidAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const billId = String(formData.get("billId") ?? "");

  const parsed = paymentSchema.safeParse({
    amountPaid: formData.get("amountPaid"),
    transactionFee: formData.get("transactionFee"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment details." };
  }

  await markBillPaidLib(billId, parsed.data.amountPaid, parsed.data.transactionFee);
  revalidatePath(`/admin/vendors/${vendorId}`);
  return {};
}

export async function markInvoicePaidAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");

  const parsed = paymentSchema.safeParse({
    amountPaid: formData.get("amountPaid"),
    transactionFee: formData.get("transactionFee"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment details." };
  }

  await markSubmissionPaid(submissionId, parsed.data.amountPaid, parsed.data.transactionFee);
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin/invoices");
  return {};
}

export async function markInvoiceUnpaidAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const vendorId = String(formData.get("vendorId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");

  await markSubmissionUnpaid(submissionId);
  revalidatePath(`/admin/vendors/${vendorId}`);
  revalidatePath("/admin/invoices");
  return {};
}
