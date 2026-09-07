import "server-only";
import { prisma } from "@/lib/prisma";

// Excludes 0/O and 1/I to avoid ambiguity when read off a printed invoice.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/** Generates a short per-vendor code (e.g. "A7K2") used in invoice numbers, unique across vendors. */
export async function generateUniqueVendorCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.vendor.findUnique({ where: { vendorCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique vendor code");
}
