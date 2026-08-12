import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getOrgSettings } from "@/lib/orgSettings";
import { renderInvoicePdf } from "@/lib/pdf/render";
import { vendorDisplayName, vendorAddress, logoToDataUri, signatureToDataUri } from "@/lib/invoice";
import { formatInvoiceNumber } from "@/lib/invoiceNumber";
import type { InvoicePdfData, InvoiceLineItemView } from "@/lib/pdf/types";
import type { InvoiceTemplate } from "@prisma/client";

const TEMPLATES: InvoiceTemplate[] = ["CLASSIC", "MODERN", "MINIMAL", "BOLD"];
const dateFormat = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" });

const SAMPLE_LINE_ITEMS: InvoiceLineItemView[] = [
  { date: dateFormat.format(new Date()), description: "Consulting services - Sample line item", quantity: "10", rate: "120.00", amount: "1,200.00" },
  { date: dateFormat.format(new Date()), description: "Platform integration support", quantity: "5", rate: "150.00", amount: "750.00" },
  { date: dateFormat.format(new Date()), description: "Documentation & handover", quantity: "1", rate: "300.00", amount: "300.00" },
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "VENDOR" || !session.vendorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: session.vendorId } });
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (vendor.status !== "APPROVED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const templateParam = req.nextUrl.searchParams.get("template") as InvoiceTemplate | null;
  const template = templateParam && TEMPLATES.includes(templateParam) ? templateParam : vendor.invoiceTemplate;

  const watermarkText = req.nextUrl.searchParams.get("watermarkText") ?? vendor.watermarkText;
  const footerText = req.nextUrl.searchParams.get("footerText") ?? vendor.footerText;

  const orgSettings = await getOrgSettings();
  const total = SAMPLE_LINE_ITEMS.reduce((sum, li) => sum + Number(li.amount.replace(/,/g, "")), 0);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const data: InvoicePdfData = {
    invoiceNumber: formatInvoiceNumber(vendor.invoiceSequence + 1),
    issueDate: dateFormat.format(new Date()),
    dueDate: dateFormat.format(dueDate),
    vendorDisplayName: vendorDisplayName(vendor) || "Your Business Name",
    vendorAddress: vendorAddress(vendor) || "Your business address",
    vendorEmail: vendor.vendorEmail,
    vendorPhone: vendor.phone,
    billToName: orgSettings.companyName,
    billToAddress: orgSettings.address ?? undefined,
    billToEmail: orgSettings.email,
    lineItems: SAMPLE_LINE_ITEMS,
    total: total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    payment: {
      bankName: vendor.bankName || "Sample Bank",
      accountNumber: vendor.accountNumber || "0000000000",
      accountHolderName: vendor.accountHolderName || vendorDisplayName(vendor) || "Sample Account Holder",
      ifsc: vendor.ifsc,
      swift: vendor.swift || "SAMPLEXX",
    },
    logoDataUri: await logoToDataUri(vendor),
    signatureDataUri: await signatureToDataUri(vendor),
    watermarkText,
    footerText,
    notes: "This is a sample preview generated with placeholder line items.",
  };

  const buffer = await renderInvoicePdf(template, data);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"invoice-preview.pdf\"",
      "Cache-Control": "no-store",
    },
  });
}
