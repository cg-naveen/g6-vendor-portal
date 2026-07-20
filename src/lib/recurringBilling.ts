import "server-only";
import { prisma } from "@/lib/prisma";
import { createInvoiceSubmission } from "@/lib/invoice";

function addOneMonth(date: Date): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, daysInTargetMonth));
  return d;
}

export async function runDueRecurringBilling(): Promise<{ generated: number; vendorNames: string[] }> {
  const now = new Date();
  const dueVendors = await prisma.vendor.findMany({
    where: {
      accountType: "CONTRACT_FREELANCER",
      status: "APPROVED",
      autoBillingEnabled: true,
      nextBillingDate: { lte: now },
      recurringAmount: { not: null },
    },
  });

  const vendorNames: string[] = [];

  for (const vendor of dueVendors) {
    if (!vendor.recurringAmount || !vendor.nextBillingDate) continue;

    await createInvoiceSubmission({
      vendor,
      source: "ADMIN",
      notes: "Auto-generated recurring invoice",
      isRecurring: true,
      lineItems: [
        {
          date: now,
          description: vendor.recurringDescription || "Recurring contract billing",
          quantity: 1,
          rate: Number(vendor.recurringAmount),
        },
      ],
    });

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { nextBillingDate: addOneMonth(vendor.nextBillingDate), lastBilledAt: now },
    });

    vendorNames.push(vendor.companyName || vendor.vendorName || vendor.id);
  }

  return { generated: dueVendors.length, vendorNames };
}
