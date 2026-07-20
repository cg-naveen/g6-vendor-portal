export type InvoiceLineItemView = {
  date: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  issueDate: string;
  vendorDisplayName: string;
  vendorAddress: string;
  vendorEmail: string;
  vendorPhone: string;
  billToName: string;
  lineItems: InvoiceLineItemView[];
  total: string;
  logoDataUri?: string | null;
  watermarkText?: string | null;
  footerText?: string | null;
  notes?: string | null;
};
