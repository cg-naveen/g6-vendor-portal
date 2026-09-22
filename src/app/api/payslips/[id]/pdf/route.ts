import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { renderPayslipPdf } from "@/lib/pdf/render";
import { buildPayslipPdfData } from "@/lib/payroll/payslipPdf";
import { readUploadedFile } from "@/lib/storage";

/**
 * Serves a payslip PDF.
 *
 * Staff: only their own payslip on a FINALIZED run, from the locked blob.
 * Admin: stored PDF when present; otherwise renders on the fly so drafts can
 * be reviewed before finalize (same figures that will be issued).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { run: { select: { status: true } } },
  });
  if (!payslip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "STAFF") {
    const isOwn = session.employeeId === payslip.employeeId;
    const isIssued = payslip.run.status === "FINALIZED";
    if (!isOwn || !isIssued) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!payslip.pdfPath) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    if (payslip.pdfPath) {
      const data = await readUploadedFile(payslip.pdfPath);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${payslip.payslipNumber}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Admin draft (or missing blob): render from current stored figures.
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = await renderPayslipPdf(await buildPayslipPdfData(id));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payslip.payslipNumber}-preview.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
