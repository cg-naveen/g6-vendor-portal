"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { registrationSchema, loginSchema } from "@/lib/validation";
import { generateUniqueVendorCode } from "@/lib/vendorCode";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function registerVendor(_prevState: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
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
      data: {
        email: data.vendorEmail.toLowerCase(),
        passwordHash,
        role: "VENDOR",
      },
    });

    return tx.vendor.create({
      data: {
        userId: user.id,
        vendorCode,
        type: data.type,
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

  await createSession({ userId: vendor.userId, role: "VENDOR", vendorId: vendor.id });
  redirect("/vendor");
}

export async function loginUser(_prevState: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { vendor: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({ userId: user.id, role: user.role, vendorId: user.vendor?.id ?? null });

  redirect(user.role === "ADMIN" ? "/admin" : "/vendor");
}

export async function logoutUser() {
  await destroySession();
  redirect("/login");
}
