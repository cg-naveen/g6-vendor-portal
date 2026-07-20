import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function requireVendor() {
  const session = await getSession();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    redirect("/login");
  }
  const vendor = await prisma.vendor.findUnique({ where: { id: session.vendorId } });
  if (!vendor) {
    redirect("/login");
  }
  return vendor;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    redirect("/login");
  }
  return user;
}
