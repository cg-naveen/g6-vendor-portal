export function formatStructuredAddress(parts: {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  const cityLine = [parts.city, parts.postcode].filter(Boolean).join(" ");
  return [parts.line1, parts.line2, cityLine, parts.state, parts.country].filter(Boolean).join(", ");
}

export function vendorDisplayName(vendor: {
  type: "BUSINESS" | "INDIVIDUAL";
  companyName?: string | null;
  vendorName?: string | null;
}): string {
  return vendor.type === "BUSINESS" ? vendor.companyName ?? "" : vendor.vendorName ?? "";
}
