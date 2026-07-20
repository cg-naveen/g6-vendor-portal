export type InvoiceLineItemView = {
  date: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
};

export type PaymentDetailsView = {
  bankName: string;
  accountNumber: string;
  ifsc?: string | null;
  swift: string;
  bankAddress: string;
};

export type InvoicePdfData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  vendorDisplayName: string;
  vendorAddress: string;
  vendorEmail: string;
  vendorPhone: string;
  billToName: string;
  billToAddress?: string;
  lineItems: InvoiceLineItemView[];
  total: string;
  payment: PaymentDetailsView;
  logoDataUri?: string | null;
  watermarkText?: string | null;
  footerText?: string | null;
  notes?: string | null;
};
