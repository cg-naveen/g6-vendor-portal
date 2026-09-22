import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readUploadedFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { run: { select: { status: true } } },
  });
  if (!payslip || !payslip.pdfPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "STAFF") {
    const isOwn = session.employeeId === payslip.employeeId;
    const isIssued = payslip.run.status === "FINALIZED";
    if (!isOwn || !isIssued) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readUploadedFile(payslip.pdfPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payslip.payslipNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
