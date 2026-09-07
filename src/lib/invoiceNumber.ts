/**
 * Fixed format: INV-{2-digit year}-{vendor code}-{4-digit auto-incrementing per-vendor sequence}.
 * The sequence itself is vendor-scoped (Vendor.invoiceSequence) so it can be reset or
 * fixed by the vendor in Invoice Settings; the "INV-{YY}-{vendorCode}-" prefix is not configurable.
 */
export function formatInvoiceNumber(sequence: number, vendorCode: string, date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  return `INV-${yy}-${vendorCode}-${String(sequence).padStart(4, "0")}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCT-${y}${m}-${rand}`;
}
