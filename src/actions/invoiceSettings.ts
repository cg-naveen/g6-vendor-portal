"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/currentUser";
import { saveUploadedFile } from "@/lib/storage";

export type FormState = {
  error?: string;
  success?: boolean;
};

const settingsSchema = z.object({
  invoiceTemplate: z.enum(["CLASSIC", "MODERN", "MINIMAL", "BOLD"]),
  watermarkText: z.string().trim().max(60).optional(),
  footerText: z.string().trim().max(200).optional(),
});

export async function updateInvoiceSettings(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  if (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "Invoice customization is only available for Freelancer and Contract Freelancer accounts." };
  }

  const parsed = settingsSchema.safeParse({
    invoiceTemplate: formData.get("invoiceTemplate"),
    watermarkText: formData.get("watermarkText"),
    footerText: formData.get("footerText"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  let logoUrl: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const { url } = await saveUploadedFile(logoFile, `logos/${vendor.id}`);
    logoUrl = url;
  }

  let signatureUrl: string | undefined;
  const signatureFile = formData.get("signature");
  if (signatureFile instanceof File && signatureFile.size > 0) {
    const { url } = await saveUploadedFile(signatureFile, `signatures/${vendor.id}`);
    signatureUrl = url;
  }

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      invoiceTemplate: parsed.data.invoiceTemplate,
      watermarkText: parsed.data.watermarkText || null,
      footerText: parsed.data.footerText || null,
      ...(logoUrl ? { logoUrl } : {}),
      ...(signatureUrl ? { signatureUrl } : {}),
    },
  });

  revalidatePath("/vendor/invoice-settings");
  return { success: true };
}

const nextInvoiceNumberSchema = z.object({
  nextInvoiceNumber: z.coerce.number().int().min(1, "Must be at least 1"),
});

/**
 * Lets the vendor fix/reset the sequence counter behind their invoice numbers. The
 * "INV-{YY}-" prefix itself is fixed and not configurable — only the running sequence is.
 */
export async function updateNextInvoiceNumber(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  if (vendor.accountType !== "FREELANCER" && vendor.accountType !== "CONTRACT_FREELANCER") {
    return { error: "Invoice customization is only available for Freelancer and Contract Freelancer accounts." };
  }

  const parsed = nextInvoiceNumberSchema.safeParse({ nextInvoiceNumber: formData.get("nextInvoiceNumber") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid invoice number." };
  }

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { invoiceSequence: parsed.data.nextInvoiceNumber - 1 },
  });

  revalidatePath("/vendor/invoice-settings");
  return { success: true };
}
