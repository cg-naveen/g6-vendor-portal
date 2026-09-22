import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/currentUser";
import { renderPayslipPdf } from "@/lib/pdf/render";
import { buildPayslipPdfData } from "@/lib/payroll/payslipPdf";

/**
 * Renders a payslip PDF on demand so the layout can be compared against the
 * reference document while iterating on the template. Not a product feature:
 * disabled outside development, and admin-only even there.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await requireAdmin();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Pass ?id=<payslipId>" }, { status: 400 });

  const buffer = await renderPayslipPdf(await buildPayslipPdfData(id));
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=preview.pdf" },
  });
}
