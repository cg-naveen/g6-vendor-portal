import { z } from "zod";

const req = (label: string) => z.string().trim().min(1, `${label} is required`);

export const bankSchema = z.object({
  bankName: req("Bank name"),
  accountNumber: req("Account number"),
  ifsc: z.string().trim().optional(),
  swift: req("SWIFT code"),
  bankAddress: req("Bank address"),
});

export const commonVendorSchema = z.object({
  vendorEmail: req("Vendor email").email("Enter a valid email"),
  phone: req("Phone number"),
  country: req("Country"),
  city: req("City"),
  state: req("State"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const businessRegistrationSchema = z
  .object({
    type: z.literal("BUSINESS"),
    companyName: req("Company name"),
    companyRegNumber: z.string().trim().optional(),
    businessAddress: req("Business address"),
    contactPersonName: req("Contact person name"),
    contactPersonEmail: req("Contact person email").email("Enter a valid contact email"),
    contactPersonPhone: req("Contact person phone"),
  })
  .merge(commonVendorSchema)
  .merge(bankSchema);

export const individualRegistrationSchema = z
  .object({
    type: z.literal("INDIVIDUAL"),
    vendorName: req("Vendor name"),
    homeAddress: req("Vendor home address"),
  })
  .merge(commonVendorSchema)
  .merge(bankSchema);

export const registrationSchema = z.discriminatedUnion("type", [
  businessRegistrationSchema,
  individualRegistrationSchema,
]);

export type RegistrationInput = z.infer<typeof registrationSchema>;

const accountTypeField = z.object({
  accountType: z.enum(["BUSINESS", "FREELANCER", "CONTRACT_FREELANCER"]),
});

export const adminCreateVendorSchema = z.discriminatedUnion("type", [
  businessRegistrationSchema.merge(accountTypeField),
  individualRegistrationSchema.merge(accountTypeField),
]);

export const loginSchema = z.object({
  email: req("Email").email("Enter a valid email"),
  password: req("Password"),
});

export const taskLineItemSchema = z.object({
  date: req("Date"),
  description: req("Description"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
});

export const taskSubmissionSchema = z.object({
  notes: z.string().trim().optional(),
  lineItems: z.array(taskLineItemSchema).min(1, "Add at least one task row"),
});
