import "server-only";
import { prisma } from "@/lib/prisma";
import { createInvoiceSubmission } from "@/lib/invoice";
import {
  addMonthsOnBillingDay,
  billingDayFromDate,
  parseDateInput,
  startOfUtcDay,
} from "@/lib/billingDates";
import type { Vendor } from "@prisma/client";

export type RecurringBillingResult = {
  generated: number;
  vendorNames: string[];
  skipped: number;
};

function vendorLabel(vendor: Vendor): string {
  return vendor.companyName || vendor.vendorName || vendor.id;
}

function resolveBillingDay(vendor: Vendor, anchor: Date): number {
  return vendor.billingDayOfMonth ?? billingDayFromDate(anchor);
}

async function recurringInvoiceExists(vendorId: string, billingDate: Date): Promise<boolean> {
  const dayStart = startOfUtcDay(billingDate);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const existing = await prisma.invoiceSubmission.findFirst({
    where: {
      vendorId,
      isRecurring: true,
      lineItems: {
        some: {
          date: { gte: dayStart, lt: dayEnd },
        },
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function runRecurringBillingForVendor(vendor: Vendor): Promise<number> {
  if (
    vendor.accountType !== "CONTRACT_FREELANCER" ||
    vendor.status !== "APPROVED" ||
    !vendor.autoBillingEnabled ||
    !vendor.recurringAmount ||
    !vendor.nextBillingDate
  ) {
    return 0;
  }

  const today = startOfUtcDay(new Date());
  let cursor = startOfUtcDay(vendor.nextBillingDate);
  const billingDay = resolveBillingDay(vendor, cursor);
  let generated = 0;
  let lastBilledAt: Date | null = vendor.lastBilledAt;

  while (cursor <= today) {
    if (!(await recurringInvoiceExists(vendor.id, cursor))) {
      await createInvoiceSubmission({
        vendor,
        source: "ADMIN",
        notes: "Auto-generated recurring invoice",
        isRecurring: true,
        lineItems: [
          {
            date: cursor,
            description: vendor.recurringDescription || "Recurring contract billing",
            quantity: 1,
            rate: Number(vendor.recurringAmount),
          },
        ],
      });
      generated++;
      lastBilledAt = cursor;
    }

    cursor = addMonthsOnBillingDay(cursor, billingDay);
  }

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      nextBillingDate: cursor,
      billingDayOfMonth: billingDay,
      ...(lastBilledAt ? { lastBilledAt } : {}),
    },
  });

  return generated;
}

export async function runDueRecurringBilling(): Promise<RecurringBillingResult> {
  const dueVendors = await prisma.vendor.findMany({
    where: {
      accountType: "CONTRACT_FREELANCER",
      status: "APPROVED",
      autoBillingEnabled: true,
      nextBillingDate: { not: null },
      recurringAmount: { not: null },
    },
  });

  const vendorNames: string[] = [];
  let generated = 0;
  let skipped = 0;

  for (const vendor of dueVendors) {
    if (!vendor.nextBillingDate || startOfUtcDay(vendor.nextBillingDate) > startOfUtcDay(new Date())) {
      skipped++;
      continue;
    }

    const count = await runRecurringBillingForVendor(vendor);
    if (count > 0) {
      generated += count;
      vendorNames.push(vendorLabel(vendor));
    }
  }

  return { generated, vendorNames, skipped };
}

export function buildAutoBillingUpdate(data: {
  autoBillingEnabled: boolean;
  recurringDescription: string;
  recurringAmount: string;
  nextBillingDate: string;
  billingDayOfMonth: string;
}) {
  const nextBillingDate = data.nextBillingDate ? parseDateInput(data.nextBillingDate) : null;
  const parsedBillingDay = Number(data.billingDayOfMonth);

  const billingDayOfMonth =
    Number.isInteger(parsedBillingDay) && parsedBillingDay >= 1 && parsedBillingDay <= 31
      ? parsedBillingDay
      : nextBillingDate
        ? billingDayFromDate(nextBillingDate)
        : null;

  return {
    autoBillingEnabled: data.autoBillingEnabled,
    recurringDescription: data.recurringDescription || null,
    recurringAmount: data.recurringAmount ? Number(data.recurringAmount) : null,
    nextBillingDate,
    billingDayOfMonth,
  };
}
