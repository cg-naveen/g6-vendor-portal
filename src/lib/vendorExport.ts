import { formatStructuredAddress, vendorDisplayName } from "@/lib/vendorFormatting";

export type VendorExportColumnId =
  | "displayName"
  | "vendorType"
  | "status"
  | "accountType"
  | "companyName"
  | "registrationNumber"
  | "businessAddress"
  | "contactPerson"
  | "contactEmail"
  | "contactPhone"
  | "vendorName"
  | "homeAddress"
  | "homeAddressLine1"
  | "homeAddressLine2"
  | "homeCity"
  | "homePostcode"
  | "homeState"
  | "homeCountry"
  | "vendorEmail"
  | "phone"
  | "contactCountry"
  | "contactCity"
  | "contactState"
  | "registered"
  | "bankName"
  | "accountHolderName"
  | "accountNumber"
  | "ifsc"
  | "swift"
  | "bankAddress"
  | "bankAddressLine1"
  | "bankAddressLine2"
  | "bankCity"
  | "bankPostcode"
  | "bankState"
  | "bankCountry"
  | "contractInformation"
  | "autoBillingEnabled"
  | "recurringDescription"
  | "recurringAmount"
  | "billingDayOfMonth"
  | "nextBillingDate"
  | "lastBilledAt"
  | "invoiceNumber"
  | "invoiceDate"
  | "enteredBy"
  | "invoiceTotal"
  | "paymentStatus"
  | "autoInvoice";

export type VendorExportColumn = {
  id: VendorExportColumnId;
  label: string;
  group: string;
};

export const VENDOR_EXPORT_COLUMNS: VendorExportColumn[] = [
  { id: "displayName", label: "Display Name", group: "Vendor" },
  { id: "vendorType", label: "Vendor Type", group: "Vendor" },
  { id: "status", label: "Status", group: "Vendor" },
  { id: "accountType", label: "Account Type", group: "Vendor" },
  { id: "companyName", label: "Company Name", group: "Vendor Details" },
  { id: "registrationNumber", label: "Registration Number", group: "Vendor Details" },
  { id: "businessAddress", label: "Business Address", group: "Vendor Details" },
  { id: "contactPerson", label: "Contact Person", group: "Vendor Details" },
  { id: "contactEmail", label: "Contact Email", group: "Vendor Details" },
  { id: "contactPhone", label: "Contact Phone", group: "Vendor Details" },
  { id: "vendorName", label: "Vendor Name", group: "Vendor Details" },
  { id: "homeAddress", label: "Home Address", group: "Vendor Details" },
  { id: "homeAddressLine1", label: "Home Address Line 1", group: "Vendor Details" },
  { id: "homeAddressLine2", label: "Home Address Line 2", group: "Vendor Details" },
  { id: "homeCity", label: "Home City", group: "Vendor Details" },
  { id: "homePostcode", label: "Home Postcode", group: "Vendor Details" },
  { id: "homeState", label: "Home State", group: "Vendor Details" },
  { id: "homeCountry", label: "Home Country", group: "Vendor Details" },
  { id: "vendorEmail", label: "Vendor Email", group: "Vendor Details" },
  { id: "phone", label: "Phone", group: "Vendor Details" },
  { id: "contactCountry", label: "Contact Country", group: "Vendor Details" },
  { id: "contactCity", label: "Contact City", group: "Vendor Details" },
  { id: "contactState", label: "Contact State", group: "Vendor Details" },
  { id: "registered", label: "Registered", group: "Vendor Details" },
  { id: "bankName", label: "Bank Name", group: "Bank Details" },
  { id: "accountHolderName", label: "Account Holder Name", group: "Bank Details" },
  { id: "accountNumber", label: "Account Number", group: "Bank Details" },
  { id: "ifsc", label: "IFSC", group: "Bank Details" },
  { id: "swift", label: "SWIFT", group: "Bank Details" },
  { id: "bankAddress", label: "Bank Address", group: "Bank Details" },
  { id: "bankAddressLine1", label: "Bank Address Line 1", group: "Bank Details" },
  { id: "bankAddressLine2", label: "Bank Address Line 2", group: "Bank Details" },
  { id: "bankCity", label: "Bank City", group: "Bank Details" },
  { id: "bankPostcode", label: "Bank Postcode", group: "Bank Details" },
  { id: "bankState", label: "Bank State", group: "Bank Details" },
  { id: "bankCountry", label: "Bank Country", group: "Bank Details" },
  { id: "contractInformation", label: "Contract Information", group: "Contract" },
  { id: "autoBillingEnabled", label: "Auto Billing Enabled", group: "Auto-Billing" },
  { id: "recurringDescription", label: "Recurring Description", group: "Auto-Billing" },
  { id: "recurringAmount", label: "Recurring Amount", group: "Auto-Billing" },
  { id: "billingDayOfMonth", label: "Billing Day of Month", group: "Auto-Billing" },
  { id: "nextBillingDate", label: "Next Billing Date", group: "Auto-Billing" },
  { id: "lastBilledAt", label: "Last Billed At", group: "Auto-Billing" },
  { id: "invoiceNumber", label: "Invoice #", group: "Invoices" },
  { id: "invoiceDate", label: "Invoice Date", group: "Invoices" },
  { id: "enteredBy", label: "Entered By", group: "Invoices" },
  { id: "invoiceTotal", label: "Invoice Total", group: "Invoices" },
  { id: "paymentStatus", label: "Payment", group: "Invoices" },
  { id: "autoInvoice", label: "Auto Invoice", group: "Invoices" },
];

export const DEFAULT_VENDOR_EXPORT_COLUMNS: VendorExportColumnId[] = [
  "displayName",
  "vendorType",
  "status",
  "accountType",
  "vendorName",
  "homeAddress",
  "vendorEmail",
  "phone",
  "contactCountry",
  "contactCity",
  "contactState",
  "registered",
  "bankName",
  "accountHolderName",
  "accountNumber",
  "ifsc",
  "swift",
  "bankAddress",
  "contractInformation",
  "autoBillingEnabled",
  "recurringDescription",
  "recurringAmount",
  "billingDayOfMonth",
  "nextBillingDate",
  "invoiceNumber",
  "invoiceDate",
  "enteredBy",
  "invoiceTotal",
  "paymentStatus",
  "autoInvoice",
];

type VendorExportVendor = {
  type: "BUSINESS" | "INDIVIDUAL";
  status: string;
  accountType: string | null;
  companyName: string | null;
  companyRegNumber: string | null;
  businessAddress: string | null;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  vendorName: string | null;
  homeAddressLine1: string | null;
  homeAddressLine2: string | null;
  homeCity: string | null;
  homePostcode: string | null;
  homeState: string | null;
  homeCountry: string | null;
  vendorEmail: string;
  phone: string;
  country: string;
  city: string;
  state: string;
  createdAt: string;
  bankName: string;
  accountHolderName: string | null;
  accountNumber: string;
  ifsc: string | null;
  swift: string;
  bankAddressLine1: string | null;
  bankAddressLine2: string | null;
  bankCity: string | null;
  bankPostcode: string | null;
  bankState: string | null;
  bankCountry: string | null;
  contractInfo: string | null;
  autoBillingEnabled: boolean;
  recurringDescription: string | null;
  recurringAmount: number | null;
  billingDayOfMonth: number | null;
  nextBillingDate: string | null;
  lastBilledAt: string | null;
};

type VendorExportBill = {
  fileName: string;
  submittedAt: string;
  amount: number;
  status: string;
  paymentStatus: string;
};

type VendorExportSubmission = {
  invoiceNumber: string;
  createdAt: string;
  source: "VENDOR" | "ADMIN";
  paymentStatus: string;
  isRecurring: boolean;
  total: number;
};

export type VendorExportPayload = {
  vendor: VendorExportVendor;
  bills: VendorExportBill[];
  submissions: VendorExportSubmission[];
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB");
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function homeAddress(vendor: VendorExportVendor): string {
  return formatStructuredAddress({
    line1: vendor.homeAddressLine1,
    line2: vendor.homeAddressLine2,
    city: vendor.homeCity,
    postcode: vendor.homePostcode,
    state: vendor.homeState,
    country: vendor.homeCountry,
  });
}

function bankAddress(vendor: VendorExportVendor): string {
  return formatStructuredAddress({
    line1: vendor.bankAddressLine1,
    line2: vendor.bankAddressLine2,
    city: vendor.bankCity,
    postcode: vendor.bankPostcode,
    state: vendor.bankState,
    country: vendor.bankCountry,
  });
}

function baseValues(vendor: VendorExportVendor): Record<VendorExportColumnId, string> {
  return {
    displayName: vendorDisplayName({
      type: vendor.type,
      companyName: vendor.companyName,
      vendorName: vendor.vendorName,
    }),
    vendorType: vendor.type === "BUSINESS" ? "Business Vendor" : "Individual Vendor",
    status: vendor.status,
    accountType: vendor.accountType ?? "",
    companyName: vendor.companyName ?? "",
    registrationNumber: vendor.companyRegNumber ?? "",
    businessAddress: vendor.businessAddress ?? "",
    contactPerson: vendor.contactPersonName ?? "",
    contactEmail: vendor.contactPersonEmail ?? "",
    contactPhone: vendor.contactPersonPhone ?? "",
    vendorName: vendor.vendorName ?? "",
    homeAddress: homeAddress(vendor),
    homeAddressLine1: vendor.homeAddressLine1 ?? "",
    homeAddressLine2: vendor.homeAddressLine2 ?? "",
    homeCity: vendor.homeCity ?? "",
    homePostcode: vendor.homePostcode ?? "",
    homeState: vendor.homeState ?? "",
    homeCountry: vendor.homeCountry ?? "",
    vendorEmail: vendor.vendorEmail,
    phone: vendor.phone,
    contactCountry: vendor.country,
    contactCity: vendor.city,
    contactState: vendor.state,
    registered: formatDate(vendor.createdAt),
    bankName: vendor.bankName,
    accountHolderName: vendor.accountHolderName ?? "",
    accountNumber: vendor.accountNumber,
    ifsc: vendor.ifsc ?? "",
    swift: vendor.swift,
    bankAddress: bankAddress(vendor),
    bankAddressLine1: vendor.bankAddressLine1 ?? "",
    bankAddressLine2: vendor.bankAddressLine2 ?? "",
    bankCity: vendor.bankCity ?? "",
    bankPostcode: vendor.bankPostcode ?? "",
    bankState: vendor.bankState ?? "",
    bankCountry: vendor.bankCountry ?? "",
    contractInformation: stripHtml(vendor.contractInfo),
    autoBillingEnabled: vendor.autoBillingEnabled ? "Yes" : "No",
    recurringDescription: vendor.recurringDescription ?? "",
    recurringAmount: vendor.recurringAmount !== null ? vendor.recurringAmount.toFixed(2) : "",
    billingDayOfMonth: vendor.billingDayOfMonth !== null ? String(vendor.billingDayOfMonth) : "",
    nextBillingDate: formatDate(vendor.nextBillingDate),
    lastBilledAt: formatDate(vendor.lastBilledAt),
    invoiceNumber: "",
    invoiceDate: "",
    enteredBy: "",
    invoiceTotal: "",
    paymentStatus: "",
    autoInvoice: "",
  };
}

export function buildVendorExportRows(payload: VendorExportPayload): Record<VendorExportColumnId, string>[] {
  const base = baseValues(payload.vendor);
  const rows: Record<VendorExportColumnId, string>[] = [];

  if (payload.vendor.accountType === "BUSINESS") {
    for (const bill of payload.bills) {
      rows.push({
        ...base,
        invoiceNumber: bill.fileName,
        invoiceDate: formatDate(bill.submittedAt),
        enteredBy: "Vendor",
        invoiceTotal: bill.amount.toFixed(2),
        paymentStatus: bill.paymentStatus,
        autoInvoice: bill.status,
      });
    }
  } else if (payload.vendor.accountType === "FREELANCER" || payload.vendor.accountType === "CONTRACT_FREELANCER") {
    for (const submission of payload.submissions) {
      rows.push({
        ...base,
        invoiceNumber: submission.invoiceNumber,
        invoiceDate: formatDate(submission.createdAt),
        enteredBy: submission.source === "ADMIN" ? "G6 Admin" : "Vendor",
        invoiceTotal: submission.total.toFixed(2),
        paymentStatus: submission.paymentStatus,
        autoInvoice: submission.isRecurring ? "Yes" : "No",
      });
    }
  }

  if (rows.length === 0) {
    rows.push(base);
  }

  return rows;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildVendorExportCsv(
  payload: VendorExportPayload,
  selectedColumnIds: VendorExportColumnId[]
): string {
  const columns = VENDOR_EXPORT_COLUMNS.filter((column) => selectedColumnIds.includes(column.id));
  const rows = buildVendorExportRows(payload);
  const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvCell(row[column.id] ?? "")).join(","))
    .join("\n");

  return `\uFEFF${header}\n${body}`;
}

export function downloadVendorExportCsv(
  payload: VendorExportPayload,
  selectedColumnIds: VendorExportColumnId[],
  fileName: string
) {
  const csv = buildVendorExportCsv(payload, selectedColumnIds);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
