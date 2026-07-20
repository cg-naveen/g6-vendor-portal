"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireVendor, requireAdmin } from "@/lib/currentUser";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { bankSchema } from "@/lib/validation";

export type FormState = {
  error?: string;
  success?: boolean;
};

const vendorProfileSchema = z
  .object({
    phone: z.string().trim().min(1, "Phone number is required"),
    country: z.string().trim().min(1, "Country is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    businessAddress: z.string().trim().nullish(),
    contactPersonName: z.string().trim().nullish(),
    contactPersonEmail: z.string().trim().nullish(),
    contactPersonPhone: z.string().trim().nullish(),
    homeAddress: z.string().trim().nullish(),
  })
  .merge(bankSchema);

export async function updateVendorProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();

  const parsed = vendorProfileSchema.safeParse({
    phone: formData.get("phone"),
    country: formData.get("country"),
    city: formData.get("city"),
    state: formData.get("state"),
    businessAddress: formData.get("businessAddress"),
    contactPersonName: formData.get("contactPersonName"),
    contactPersonEmail: formData.get("contactPersonEmail"),
    contactPersonPhone: formData.get("contactPersonPhone"),
    homeAddress: formData.get("homeAddress"),
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
    ifsc: formData.get("ifsc"),
    swift: formData.get("swift"),
    bankAddress: formData.get("bankAddress"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const data = parsed.data;

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      phone: data.phone,
      country: data.country,
      city: data.city,
      state: data.state,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc || null,
      swift: data.swift,
      bankAddress: data.bankAddress,
      ...(vendor.type === "BUSINESS"
        ? {
            businessAddress: data.businessAddress || vendor.businessAddress,
            contactPersonName: data.contactPersonName || vendor.contactPersonName,
            contactPersonEmail: data.contactPersonEmail || vendor.contactPersonEmail,
            contactPersonPhone: data.contactPersonPhone || vendor.contactPersonPhone,
          }
        : {
            homeAddress: data.homeAddress || vendor.homeAddress,
          }),
    },
  });

  revalidatePath("/vendor/profile");
  return { success: true };
}

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changeVendorPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const vendor = await requireVendor();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the password fields." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: vendor.userId } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}

export async function changeAdminPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the password fields." };
  }

  if (!(await verifyPassword(parsed.data.currentPassword, admin.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash } });

  return { success: true };
}
