"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/currentUser";
import { createInvoiceSubmission } from "@/lib/invoice";
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
