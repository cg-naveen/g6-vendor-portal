import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getOrgSettings } from "@/lib/orgSettings";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { renderPayslipPdf } from "@/lib/pdf/render";
import type { PayslipPdfData } from "@/lib/pdf/types";
import { getSession } from "@/lib/session";
import { readUploadedFile } from "@/lib/storage";

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

function boolParam(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === "1" || value === "true";
}

async function logoDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const buffer = await readUploadedFile(url);
    const ext = path.extname(url).replace(".", "").toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Sample payslip PDF for the payroll design settings tab — same idea as
 * /api/vendor/invoice-preview. Uses placeholder figures (the golden fixture)
 * and live design overrides from query params so admins can preview before saving.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org, settings] = await Promise.all([getOrgSettings(), getPayrollSettings()]);
  const params = req.nextUrl.searchParams;

  const accentColor = params.get("accentColor")?.trim() || settings.accentColor;
  const showEmployerContributions = boolParam(params.get("showEmployerContributions"), settings.showEmployerContributions);
  const showHrdfColumn = boolParam(params.get("showHrdfColumn"), settings.showHrdfColumn);
  const showZakatColumn = boolParam(params.get("showZakatColumn"), settings.showZakatColumn);
  const epfFootnote = params.has("epfFootnote") ? params.get("epfFootnote") : settings.epfFootnote;
  const payslipFooterText = params.has("payslipFooterText")
    ? params.get("payslipFooterText")
    : settings.payslipFooterText;

  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const data: PayslipPdfData = {
    employerName: org.companyName || "Your Company Name",
    employerAddressLines: (org.address ?? "Your company address")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    businessRegNumber: settings.businessRegNumber,

    periodLabel: `Payslip for ${monthYear.format(periodStart)}`,
    issuedOnLabel: `Issued on: ${fullDate.format(now)}`,

    employeeName: "Sample Employee",
    designation: "Software Engineer",
    fields: [
      { label: "Department", value: "Engineering" },
      { label: "Nationality", value: "Malaysian" },
      { label: "NRIC/Passport", value: "900101-14-XXXX" },
      { label: "EPF No", value: "12345678" },
      { label: "Employee ID", value: `${settings.employeeCodePrefix}001` },
      { label: "Gender", value: "Male" },
      { label: "PCB No", value: "SG123456789012" },
      { label: "SOCSO No", value: "A1234567" },
    ],

    earnings: [{ label: "Salary", units: null, rate: null, amount: money.format(5300) }],
    wageDeductions: [],
    grossPay: money.format(5300),

    contributions: [
      {
        label: "Employee",
        epf: money.format(583),
        socso: money.format(26.25),
        eis: money.format(10.5),
        zakat: money.format(0),
        pcb: money.format(130.5),
        hrdf: money.format(0),
        total: money.format(750.25),
      },
      {
        label: "Employer",
        epf: money.format(636),
        socso: money.format(91.85),
        eis: money.format(10.5),
        zakat: money.format(0),
        pcb: money.format(0),
        hrdf: money.format(settings.hrdfEnabled ? 53 : 0),
        total: null,
      },
    ],

    netDeductions: [],
    netPay: money.format(4549.75),
    taxablePay: money.format(5300),

    logoDataUri: await logoDataUri(settings.payslipLogoUrl),
    accentColor: /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : settings.accentColor,
    showEmployerContributions,
    showHrdfColumn,
    showZakatColumn,
    footnotes: [
      (epfFootnote && epfFootnote.trim()) ||
        `EPF contributions are calculated based on ${money.format(Number(settings.epfEmployeeRate))}% employee rate and ${money.format(Number(settings.epfEmployerRate))}% employer rate`,
      "PCB Calculations are based on the following employee info: Resident, Normal Worker, Single, No Dependent Children",
      "This is a sample preview generated with placeholder figures.",
    ],
    footerText: payslipFooterText,
  };

  const buffer = await renderPayslipPdf(data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="payslip-preview.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
