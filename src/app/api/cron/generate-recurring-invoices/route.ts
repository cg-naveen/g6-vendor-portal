import { NextRequest, NextResponse } from "next/server";
import { runDueRecurringBilling } from "@/lib/recurringBilling";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret");

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDueRecurringBilling();
  return NextResponse.json(result);
}
