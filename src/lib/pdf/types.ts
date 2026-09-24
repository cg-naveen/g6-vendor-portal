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
  accountHolderName: string;
  ifsc?: string | null;
  swift: string;
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
  billToEmail?: string | null;
  lineItems: InvoiceLineItemView[];
  total: string;
  payment: PaymentDetailsView;
  logoDataUri?: string | null;
  signatureDataUri?: string | null;
  watermarkText?: string | null;
  footerText?: string | null;
  notes?: string | null;
};

export type PayslipAmountRow = {
  label: string;
  units?: string | null;
  rate?: string | null;
  amount: string;
};

export type PayslipContributionRow = {
  /** "Employee" or "Employer". */
  label: string;
  epf: string;
  socso: string;
  eis: string;
  zakat: string;
  pcb: string;
  hrdf: string;
  /** Shown on the employee row only — the total deducted from pay. */
  total?: string | null;
};

/**
 * Everything the payslip template prints. Every monetary field is an
 * already-formatted string: the template must not do arithmetic or rounding.
 */
export type PayslipPdfData = {
  employerName: string;
  employerAddressLines: string[];
  businessRegNumber?: string | null;

  /** "Payslip for November 2024" */
  periodLabel: string;
  /** "Issued on: 03 December 2024" */
  issuedOnLabel: string;

  employeeName: string;
  designation: string;
  /** The eight-field grid: Department, Nationality, NRIC/Passport, EPF No., Employee ID, Gender, PCB No., SOCSO No. */
  fields: { label: string; value: string }[];

  earnings: PayslipAmountRow[];
  /** Wage reductions (unpaid leave). Printed inside Gross Earnings as negatives. */
  wageDeductions: PayslipAmountRow[];
  grossPay: string;

  contributions: PayslipContributionRow[];

  /** Post-contribution deductions (loan, advance recovery). */
  netDeductions: PayslipAmountRow[];
  netPay: string;
  taxablePay: string;

  logoDataUri?: string | null;
  accentColor: string;
  showEmployerContributions: boolean;
  showHrdfColumn: boolean;
  showZakatColumn: boolean;
  /** Rendered at the foot, numbered from 1 in order. */
  footnotes: string[];
  footerText?: string | null;
};
