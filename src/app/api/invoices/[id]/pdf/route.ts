import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readUploadedFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await prisma.invoiceSubmission.findUnique({ where: { id } });
  if (!submission || !submission.pdfPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role !== "ADMIN" && session.vendorId !== submission.vendorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readUploadedFile(submission.pdfPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${submission.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
