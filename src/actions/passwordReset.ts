"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createResetToken, consumeResetToken } from "@/lib/passwordReset";

export type RequestResetState = {
  error?: string;
  resetLink?: string;
};

const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email");

export async function requestPasswordReset(_prevState: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.toLowerCase() } });

  // Always behave the same whether or not the account exists, to avoid leaking which emails are registered.
  if (!user) {
    return { resetLink: "" };
  }

  const rawToken = await createResetToken(user.id);
  return { resetLink: `/reset-password?token=${rawToken}` };
}

export type ResetPasswordState = {
  error?: string;
};

const resetSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const userId = await consumeResetToken(parsed.data.token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  redirect("/login?reset=success");
}
