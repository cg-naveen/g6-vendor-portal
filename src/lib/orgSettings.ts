import "server-only";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function getOrgSettings() {
  const existing = await prisma.orgSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.orgSettings.create({ data: { id: SINGLETON_ID } });
}
