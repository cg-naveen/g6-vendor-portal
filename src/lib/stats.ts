import "server-only";
import { prisma } from "@/lib/prisma";

export type FinancialSummary = {
  outstanding: number;
  paid: number;
  outstandingCount: number;
  paidCount: number;
};

export async function getVendorFinancialSummary(vendorId: string, accountType: string | null): Promise<FinancialSummary> {
  if (accountType === "BUSINESS") {
    const bills = await prisma.bill.findMany({ where: { vendorId } });
    const outstanding = bills.filter((b) => b.paymentStatus === "UNPAID");
    const paid = bills.filter((b) => b.paymentStatus === "PAID");
    return {
      outstanding: outstanding.reduce((sum, b) => sum + Number(b.amount), 0),
      paid: paid.reduce((sum, b) => sum + Number(b.amountPaid ?? b.amount), 0),
      outstandingCount: outstanding.length,
      paidCount: paid.length,
    };
  }

  const submissions = await prisma.invoiceSubmission.findMany({ where: { vendorId }, include: { lineItems: true } });
  const totals = submissions.map((s) => ({
    status: s.paymentStatus,
    amount: s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0),
    amountPaid: s.amountPaid,
  }));
  const outstanding = totals.filter((t) => t.status === "UNPAID");
  const paid = totals.filter((t) => t.status === "PAID");
  return {
    outstanding: outstanding.reduce((sum, t) => sum + t.amount, 0),
    paid: paid.reduce((sum, t) => sum + Number(t.amountPaid ?? t.amount), 0),
    outstandingCount: outstanding.length,
    paidCount: paid.length,
  };
}

export async function getOrgFinancialSummary(): Promise<FinancialSummary> {
  const [bills, submissions] = await Promise.all([
    prisma.bill.findMany(),
    prisma.invoiceSubmission.findMany({ include: { lineItems: true } }),
  ]);

  const billOutstanding = bills.filter((b) => b.paymentStatus === "UNPAID");
  const billPaid = bills.filter((b) => b.paymentStatus === "PAID");

  const subTotals = submissions.map((s) => ({
    status: s.paymentStatus,
    amount: s.lineItems.reduce((sum, li) => sum + Number(li.amount), 0),
    amountPaid: s.amountPaid,
  }));
  const subOutstanding = subTotals.filter((t) => t.status === "UNPAID");
  const subPaid = subTotals.filter((t) => t.status === "PAID");

  return {
    outstanding:
      billOutstanding.reduce((sum, b) => sum + Number(b.amount), 0) + subOutstanding.reduce((sum, t) => sum + t.amount, 0),
    paid:
      billPaid.reduce((sum, b) => sum + Number(b.amountPaid ?? b.amount), 0) +
      subPaid.reduce((sum, t) => sum + Number(t.amountPaid ?? t.amount), 0),
    outstandingCount: billOutstanding.length + subOutstanding.length,
    paidCount: billPaid.length + subPaid.length,
  };
}

const currencyFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(n: number): string {
  return currencyFormat.format(n);
}
