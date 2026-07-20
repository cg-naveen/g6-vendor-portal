"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/currentUser";

export type FormState = {
  error?: string;
  success?: boolean;
};

const settingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  address: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export async function updateOrgSettings(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    companyName: formData.get("companyName"),
    address: formData.get("address"),
    taxId: formData.get("taxId"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the billing settings." };
  }

  await prisma.orgSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
