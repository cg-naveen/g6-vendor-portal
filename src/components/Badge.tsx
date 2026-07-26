const VARIANTS = {
  paid: "g6-badge-paid",
  pending: "g6-badge-pending",
  overdue: "g6-badge-overdue",
  draft: "g6-badge-draft",
} as const;

export function Badge({ variant, children }: { variant: keyof typeof VARIANTS; children: React.ReactNode }) {
  return (
    <span className={`g6-badge ${VARIANTS[variant]}`}>
      <span className="g6-badge-dot" />
      {children}
    </span>
  );
}

export function statusBadgeVariant(status: string): keyof typeof VARIANTS {
  switch (status) {
    case "APPROVED":
    case "PAID":
      return "paid";
    case "PENDING":
    case "SUBMITTED":
    case "UNPAID":
      return "pending";
    case "REJECTED":
    case "BLOCKED":
    case "OVERDUE":
      return "overdue";
    default:
      return "draft";
  }
}
