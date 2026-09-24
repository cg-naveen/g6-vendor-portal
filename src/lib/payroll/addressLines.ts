/**
 * Turns an org address into payslip header lines.
 *
 * Billing settings often store one long comma-separated string. Newlines are
 * respected when present; otherwise we wrap at commas so the left header column
 * does not run into "Payslip for / Issued on" on the right.
 */
export function splitEmployerAddress(address: string | null | undefined): string[] {
  if (!address?.trim()) return [];

  const fromNewlines = address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (fromNewlines.length > 1) return fromNewlines;

  const single = fromNewlines[0];
  if (!single.includes(",")) return [single];

  const parts = single
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const lines: string[] = [];
  for (const part of parts) {
    const last = lines[lines.length - 1];
    const candidate = last ? `${last}, ${part}` : part;
    // Keep lines short enough to sit beside the period/issued block (~half page).
    if (last && candidate.length <= 42) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(part);
    }
  }
  return lines;
}
