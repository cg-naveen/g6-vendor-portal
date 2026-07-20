export function StatCard({
  label,
  value,
  hint,
  hintColor,
}: {
  label: string;
  value: string;
  hint?: string;
  hintColor?: "paid" | "pending" | "overdue" | "muted";
}) {
  const hintClass =
    hintColor === "paid"
      ? "text-[#5ee8c0]"
      : hintColor === "pending"
        ? "text-[#f7c96e]"
        : hintColor === "overdue"
          ? "text-[#ff9494]"
          : "text-[#8781a0]";

  return (
    <div className="g6-card px-5 py-4">
      <div className="g6-kpi-label">{label}</div>
      <div className="g6-kpi-value">{value}</div>
      {hint ? <div className={`mt-1.5 text-[11px] ${hintClass}`}>{hint}</div> : null}
    </div>
  );
}
