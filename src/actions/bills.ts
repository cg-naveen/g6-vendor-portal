"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor, requireAdmin } from "@/lib/currentUser";
import { saveUploadedFile } from "@/lib/storage";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const billSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().trim().optional(),
});

export async function createBill(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "BUSINESS") {
    return { error: "Only approved Business vendors can submit bills." };
  }

  const parsed = billSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const file = formData.get("invoiceFile");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please attach an invoice file.", fieldErrors: { invoiceFile: "Invoice file is required" } };
  }

  const { relativePath, fileName } = await saveUploadedFile(file, `bills/${vendor.id}`);

  await prisma.bill.create({
    data: {
      vendorId: vendor.id,
      invoiceFile: relativePath,
      fileName,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
    },
  });

  redirect("/vendor/bills");
}

export async function updateBillStatus(billId: string, status: "APPROVED" | "REJECTED") {
  await requireAdmin();
  const bill = await prisma.bill.update({ where: { id: billId }, data: { status }, select: { vendorId: true } });
  revalidatePath(`/admin/vendors/${bill.vendorId}`);
}
