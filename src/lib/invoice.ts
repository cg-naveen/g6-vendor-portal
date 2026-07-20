import "server-only";
import path from "path";
import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { renderInvoicePdf } from "@/lib/pdf/render";
import { savePdf, resolveUploadPath } from "@/lib/storage";
import { generateInvoiceNumber } from "@/lib/invoiceNumber";
import { getOrgSettings } from "@/lib/orgSettings";
import type { InvoicePdfData, InvoiceLineItemView } from "@/lib/pdf/types";
import type { Vendor } from "@prisma/client";

const numberFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" });

function fmt(n: number) {
  return numberFormat.format(n);
}

export type LineItemInput = {
  date: Date;
  description: string;
  quantity: number;
  rate: number;
};

export async function logoToDataUri(vendor: Vendor): Promise<string | null> {
  if (!vendor.logoUrl) return null;
  try {
    const filePath = resolveUploadPath(vendor.logoUrl);
    const buf = await readFile(filePath);
    const ext = path.extname(filePath).replace(".", "").toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function vendorDisplayName(vendor: Vendor): string {
  return vendor.type === "BUSINESS" ? vendor.companyName ?? "" : vendor.vendorName ?? "";
}

export function vendorAddress(vendor: Vendor): string {
  const line = vendor.type === "BUSINESS" ? vendor.businessAddress ?? "" : vendor.homeAddress ?? "";
  return [line, vendor.city, vendor.state, vendor.country].filter(Boolean).join(", ");
}

/**
 * Creates an InvoiceSubmission with line items and generates the PDF, storing it on disk.
 */
export async function createInvoiceSubmission(params: {
  vendor: Vendor;
  source: "VENDOR" | "ADMIN";
  notes?: string | null;
  lineItems: LineItemInput[];
  isRecurring?: boolean;
}) {
  const { vendor, source, notes, lineItems, isRecurring } = params;

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
  const invoiceNumber = generateInvoiceNumber();

  const submission = await prisma.invoiceSubmission.create({
    data: {
      vendorId: vendor.id,
      invoiceNumber,
      source,
      template: vendor.invoiceTemplate,
      notes: notes || null,
      isRecurring: isRecurring ?? false,
      lineItems: {
        create: lineItems.map((li) => ({
          date: li.date,
          description: li.description,
          quantity: li.quantity,
          rate: li.rate,
          amount: li.quantity * li.rate,
        })),
      },
    },
    include: { lineItems: true },
  });

  const pdfPath = await regenerateInvoicePdf(submission.id);

  return { submission, total, pdfPath };
}

/**
 * Re-renders the PDF for an existing submission (used after admin edits, or template/branding changes).
 */
export async function regenerateInvoicePdf(submissionId: string): Promise<string> {
  const submission = await prisma.invoiceSubmission.findUniqueOrThrow({
    where: { id: submissionId },
    include: { lineItems: { orderBy: { date: "asc" } }, vendor: true },
  });

  const vendor = submission.vendor;
  const total = submission.lineItems.reduce((sum, li) => sum + Number(li.amount), 0);
  const orgSettings = await getOrgSettings();

  const lineItemsView: InvoiceLineItemView[] = submission.lineItems.map((li) => ({
    date: dateFormat.format(li.date),
    description: li.description,
    quantity: fmt(Number(li.quantity)),
    rate: fmt(Number(li.rate)),
    amount: fmt(Number(li.amount)),
  }));

  const data: InvoicePdfData = {
    invoiceNumber: submission.invoiceNumber,
    issueDate: dateFormat.format(submission.createdAt),
    vendorDisplayName: vendorDisplayName(vendor),
    vendorAddress: vendorAddress(vendor),
    vendorEmail: vendor.vendorEmail,
    vendorPhone: vendor.phone,
    billToName: orgSettings.companyName,
    billToAddress: orgSettings.address ?? undefined,
    lineItems: lineItemsView,
    total: fmt(total),
    logoDataUri: await logoToDataUri(vendor),
    watermarkText: vendor.watermarkText,
    footerText: vendor.footerText,
    notes: submission.notes,
  };

  const buffer = await renderInvoicePdf(submission.template, data);
  const fileName = `${submission.invoiceNumber}.pdf`;
  const relativePath = await savePdf(buffer, `invoices/${vendor.id}`, fileName);

  await prisma.invoiceSubmission.update({
    where: { id: submission.id },
    data: { pdfPath: relativePath },
  });

  return relativePath;
}
