import "server-only";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getOrgSettings } from "@/lib/orgSettings";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { readUploadedFile } from "@/lib/storage";
import type { PayslipAmountRow, PayslipPdfData } from "@/lib/pdf/types";
import { splitEmployerAddress } from "@/lib/payroll/addressLines";

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

const fmt = (value: unknown) => money.format(Number(value ?? 0));

/** Mirrors logoToDataUri in src/lib/invoice.ts — react-pdf needs a data URI, not a URL. */
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

function amountRow(line: {
  label: string;
  units: unknown;
  rate: unknown;
  amount: unknown;
}): PayslipAmountRow {
  return {
    label: line.label,
    units: line.units === null || line.units === undefined ? null : money.format(Number(line.units)),
    rate: line.rate === null || line.rate === undefined ? null : money.format(Number(line.rate)),
    amount: fmt(line.amount),
  };
}

/**
 * Assembles everything the template prints from stored data.
 *
 * Reads figures off the Payslip columns rather than recomputing them: a
 * finalized payslip's numbers are frozen, and re-deriving them here would
 * reintroduce exactly the drift that snapshotting them prevents.
 */
export async function buildPayslipPdfData(payslipId: string): Promise<PayslipPdfData> {
  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    include: { lines: { orderBy: { sortOrder: "asc" } }, run: true, employee: true },
  });

  const [org, settings] = await Promise.all([getOrgSettings(), getPayrollSettings()]);

  const epfEmployeeRate =
    payslip.employee.epfEmployeeRateOverride ?? settings.epfEmployeeRate;
  const epfEmployerRate =
    payslip.employee.epfEmployerRateOverride ??
    (Number(payslip.epfBase) <= Number(settings.epfEmployerThreshold)
      ? settings.epfEmployerRateBelowThreshold
      : settings.epfEmployerRate);

  const pcbProfile = [
    payslip.employee.taxResident ? "Resident" : "Non-resident",
    payslip.employee.taxWorkerCategory,
    payslip.employee.taxMaritalStatus,
    payslip.employee.taxDependents === 0
      ? "No Dependent Children"
      : `${payslip.employee.taxDependents} Dependent Children`,
  ]
    .filter(Boolean)
    .join(", ");

  const periodStart = new Date(Date.UTC(payslip.run.year, payslip.run.month - 1, 1));

  return {
    employerName: org.companyName,
    employerAddressLines: splitEmployerAddress(org.address),
    businessRegNumber: settings.businessRegNumber,

    periodLabel: `Payslip for ${monthYear.format(periodStart)}`,
    issuedOnLabel: `Issued on: ${fullDate.format(payslip.run.issuedOn ?? payslip.createdAt)}`,

    employeeName: payslip.employeeName,
    designation: payslip.designation,
    // Field order matches the reference payslip's grid, read left to right.
    fields: [
      { label: "Department", value: payslip.department ?? "-" },
      { label: "Nationality", value: payslip.nationality ?? "-" },
      { label: "NRIC/Passport", value: payslip.nricOrPassport },
      { label: "EPF No", value: payslip.epfNumber ?? "-" },
      { label: "Employee ID", value: payslip.employee.employeeCode },
      { label: "Gender", value: payslip.gender ?? "-" },
      { label: "PCB No", value: payslip.pcbNumber ?? "-" },
      { label: "SOCSO No", value: payslip.socsoNumber ?? "-" },
    ],

    earnings: payslip.lines.filter((line) => line.kind === "EARNING").map(amountRow),
    wageDeductions: payslip.lines.filter((line) => line.kind === "WAGE_DEDUCTION").map(amountRow),
    grossPay: fmt(payslip.grossPay),

    contributions: [
      {
        label: "Employee",
        epf: fmt(payslip.epfEmployee),
        socso: fmt(payslip.socsoEmployee),
        eis: fmt(payslip.eisEmployee),
        zakat: fmt(payslip.zakat),
        pcb: fmt(payslip.pcb),
        hrdf: fmt(0),
        total: fmt(payslip.totalEmployeeDeductions),
      },
      {
        label: "Employer",
        epf: fmt(payslip.epfEmployer),
        socso: fmt(payslip.socsoEmployer),
        eis: fmt(payslip.eisEmployer),
        zakat: fmt(0),
        pcb: fmt(0),
        hrdf: fmt(payslip.hrdfEmployer),
        total: null,
      },
    ],

    netDeductions: payslip.lines.filter((line) => line.kind === "NET_DEDUCTION").map(amountRow),
    netPay: fmt(payslip.netPay),
    taxablePay: fmt(payslip.taxablePay),

    logoDataUri: await logoDataUri(settings.payslipLogoUrl),
    accentColor: settings.accentColor,
    showEmployerContributions: settings.showEmployerContributions,
    showHrdfColumn: settings.showHrdfColumn,
    showZakatColumn: settings.showZakatColumn,
    footnotes: [
      settings.epfFootnote ??
        `EPF contributions are calculated based on ${fmt(epfEmployeeRate)}% employee rate and ${fmt(epfEmployerRate)}% employer rate`,
      `PCB Calculations are based on the following employee info: ${pcbProfile}`,
    ],
    footerText: settings.payslipFooterText,
  };
}
