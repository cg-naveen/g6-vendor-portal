import "server-only";
import { prisma } from "@/lib/prisma";
import { renderReceiptPdf } from "@/lib/pdf/render";
import { savePdf } from "@/lib/storage";
import { generateReceiptNumber } from "@/lib/invoiceNumber";
import { vendorDisplayName, vendorAddress, logoToDataUri } from "@/lib/invoice";
import { getOrgSettings } from "@/lib/orgSettings";
import type { ReceiptPdfData } from "@/lib/pdf/templates/Receipt";

const numberFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" });

function fmt(n: number) {
  return numberFormat.format(n);
}

export async function markBillPaid(billId: string, amountPaid: number, transactionFee: number) {
  const bill = await prisma.bill.findUniqueOrThrow({ where: { id: billId }, include: { vendor: true } });
  const orgSettings = await getOrgSettings();
  const receiptNumber = generateReceiptNumber();
  const paidAt = new Date();

  const data: ReceiptPdfData = {
    receiptNumber,
    paidDate: dateFormat.format(paidAt),
    payerName: vendorDisplayName(bill.vendor),
    payerAddress: vendorAddress(bill.vendor),
    referenceLabel: "Bill",
    referenceNumber: bill.id,
    amountPaid: fmt(amountPaid),
    transactionFee: fmt(transactionFee),
    netAmount: fmt(amountPaid - transactionFee),
    billFromName: orgSettings.companyName,
    billFromAddress: orgSettings.address ?? "",
    logoDataUri: await logoToDataUri(bill.vendor),
  };

  const buffer = await renderReceiptPdf(data);
  const receiptPath = await savePdf(buffer, `receipts/${bill.vendorId}`, `${receiptNumber}.pdf`);

  await prisma.bill.update({
    where: { id: billId },
    data: { paymentStatus: "PAID", amountPaid, transactionFee, paidAt, receiptNumber, receiptPath },
  });
}

export async function markSubmissionPaid(submissionId: string, amountPaid: number, transactionFee: number) {
  const submission = await prisma.invoiceSubmission.findUniqueOrThrow({ where: { id: submissionId }, include: { vendor: true } });
  const orgSettings = await getOrgSettings();
  const receiptNumber = generateReceiptNumber();
  const paidAt = new Date();

  const data: ReceiptPdfData = {
    receiptNumber,
    paidDate: dateFormat.format(paidAt),
    payerName: vendorDisplayName(submission.vendor),
    payerAddress: vendorAddress(submission.vendor),
    referenceLabel: "Invoice",
    referenceNumber: submission.invoiceNumber,
    amountPaid: fmt(amountPaid),
    transactionFee: fmt(transactionFee),
    netAmount: fmt(amountPaid - transactionFee),
    billFromName: orgSettings.companyName,
    billFromAddress: orgSettings.address ?? "",
    logoDataUri: await logoToDataUri(submission.vendor),
  };

  const buffer = await renderReceiptPdf(data);
  const receiptPath = await savePdf(buffer, `receipts/${submission.vendorId}`, `${receiptNumber}.pdf`);

  await prisma.invoiceSubmission.update({
    where: { id: submissionId },
    data: { paymentStatus: "PAID", amountPaid, transactionFee, paidAt, receiptNumber, receiptPath },
  });
}
