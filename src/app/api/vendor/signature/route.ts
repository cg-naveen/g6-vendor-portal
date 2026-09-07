import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readUploadedFile } from "@/lib/storage";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: session.vendorId } });
  if (!vendor?.signatureUrl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = await readUploadedFile(vendor.signatureUrl);
    const ext = path.extname(vendor.signatureUrl).replace(".", "").toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": mime } });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
