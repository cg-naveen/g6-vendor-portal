"use client";

import { useRouter } from "next/navigation";

export function VendorFilterSelect({
  vendors,
  vendorId,
  status,
}: {
  vendors: { id: string; label: string }[];
  vendorId?: string;
  status?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={vendorId ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (e.target.value) params.set("vendorId", e.target.value);
        const qs = params.toString();
        router.push(qs ? `/admin/invoices?${qs}` : "/admin/invoices");
      }}
      className="g6-input g6-select !py-1.5 !text-xs"
      style={{ width: 220 }}
    >
      <option value="">All vendors</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id}>
          {v.label}
        </option>
      ))}
    </select>
  );
}
