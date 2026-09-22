import { z } from "zod";

const req = (label: string) => z.string().trim().min(1, `${label} is required`);
const optional = z.string().trim().optional();

/** Fields an admin may edit at any time. Excludes the login email and password. */
export const employeeCoreSchema = z.object({
  fullName: req("Full name"),
  designation: req("Designation"),
  department: optional,
  nationality: optional,
  gender: optional,

  nricOrPassport: req("NRIC or passport number"),
  epfNumber: optional,
  socsoNumber: optional,
  pcbNumber: optional,

  email: req("Email").email("Enter a valid email"),
  phone: req("Phone number"),

  addressLine1: optional,
  addressLine2: optional,
  city: optional,
  postcode: optional,
  state: optional,
  country: optional,

  bankName: req("Bank name"),
  accountNumber: req("Account number"),
  accountHolderName: optional,

  hiredOn: req("Hire date"),

  epfEnabled: z.coerce.boolean(),
  socsoEnabled: z.coerce.boolean(),
  eisEnabled: z.coerce.boolean(),

  // Blank means "use the statutory rate from settings", not zero.
  epfEmployeeRateOverride: optional,
  epfEmployerRateOverride: optional,
  monthlyZakat: optional,

  taxResident: z.coerce.boolean(),
  taxWorkerCategory: optional,
  taxMaritalStatus: optional,
  taxDependents: z.coerce.number().int().min(0, "Dependents cannot be negative").default(0),
});

export const employeeSchema = employeeCoreSchema.merge(
  z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    monthlySalary: z.coerce.number().positive("Starting salary must be greater than 0"),
  })
);

export const employeeUpdateSchema = employeeCoreSchema;

export const salaryRecordSchema = z.object({
  monthlySalary: z.coerce.number().positive("Salary must be greater than 0"),
  effectiveFrom: req("Effective date"),
  reason: optional,
});

export const employmentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "RESIGNED", "TERMINATED"]),
  endedOn: optional,
});
