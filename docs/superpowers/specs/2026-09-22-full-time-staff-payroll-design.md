# Full-Time Staff Support & Monthly Payslips — Design

- **Date:** 2026-09-22
- **Status:** Approved design, pending implementation plan
- **Scope:** Add full-time employees and monthly payroll to the G6 Vendor Portal, producing Malaysian statutory payslips.

## 1. Context

The portal today supports only vendors. Three `AccountType` values — `BUSINESS`, `FREELANCER`, `CONTRACT_FREELANCER` — all model an accounts-payable flow: vendor submits or is credited work, an invoice or bill is produced, admin pays it and a receipt is generated. There is no concept of employment: no payroll, no payslip, no statutory deduction, no employee record. The only trace of the idea anywhere in the codebase is the phrase "contract employee" in UI copy at `src/app/admin/vendors/new/page.tsx:7`, with nothing behind it.

This design adds a parallel payroll subsystem: employees, an effective-dated salary timeline, monthly payroll runs, a statutory calculation engine, and a payslip PDF modelled on a supplied reference document.

### Reference payslip

A sample payslip was supplied as the target layout and the source of truth for calculation correctness. Its figures:

| Item | Employee | Employer |
| --- | --- | --- |
| Gross / Taxable pay | 5300.00 | — |
| EPF | 583.00 | 636.00 |
| SOCSO | 26.25 | 91.85 |
| EIS | 10.50 | 10.50 |
| Zakat | 0.00 | — |
| PCB | 130.50 | 0.00 |
| HRDF | 0.00 | 0.00 |
| **Total deductions** | **750.25** | |
| **Net pay** | **4549.75** | |

Layout: employer block (name, address, business registration number) with "Payslip for <Month Year>" and "Issued on <date>"; employee name and designation; an eight-field grid (Department, Nationality, NRIC/Passport, EPF No., Employee ID, Gender, PCB No., SOCSO No.); a Gross Earnings table with Units / Rate / Amount columns; a Contributions matrix with separate employee and employer rows across EPF / SOCSO / EIS / Zakat / PCB / HRDF; a Net Earnings section with Net pay and Taxable pay; and two numbered footnotes (EPF rates used; the PCB profile assumed).

### Critical finding: only some deductions are percentages

The original request was for "settings to control the calculation/percentage of deductions". That is only directly true for some of them:

- **EPF** is rate-driven. 5300 x 11% = 583.00 and 5300 x 12% = 636.00 both land exactly, and the reference's own footnote describes it as a percentage.
- **SOCSO and EIS** are wage-band tables. Applying 0.5% directly to 5300 gives 26.50, but the reference says 26.25 — the statutory figure derives from the band *midpoint*, not the salary.
- **PCB** is not a percentage at all. It comes from the LHDN Monthly Tax Deduction schedule and depends on residency, worker category, marital status and dependents — exactly the profile the reference's footnote 2 records.
- **Zakat** is an employee-elected fixed amount.
- **HRDF** is an employer-only levy, rate-driven, applicable only to PSMB-registered employers.

A percentage-only engine would therefore produce payslips that look plausible but do not reconcile with what is actually remitted to EPF, PERKESO and LHDN. The design below resolves this without giving up configurability (section 5).

## 2. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Hybrid calculation: band tables for SOCSO/EIS, rates for EPF/HRDF, manual entry for PCB | Reproduces the reference exactly without maintaining the LHDN MTD formula, which would need a full tax profile and re-verification every Budget |
| 2 | Staff log in, with their own `/staff` portal section | No SMTP is wired up, so without login there is no in-portal way to deliver a payslip. Reuses `AppShell`, middleware, session and the authenticated-blob-stream pattern |
| 3 | Monthly batch payroll run: draft, review, finalize, lock | PCB is hand-entered, so a review step is mandatory regardless. Locking means an issued payslip can never silently change |
| 4 | Flexible earning/deduction lines, each with taxable / EPF-able / SOCSO-able flags | In Malaysia these differ per allowance type. Without flags the contribution base is wrong whenever anything beyond basic salary appears — and it is precisely why the reference prints Gross and Taxable separately |
| 5 | One payslip template faithful to the reference, plus org-level branding settings | A payslip is a compliance document; layout variety buys nothing and multiplies the surface that must render the contribution matrix correctly |
| 6 | Same legal entity as invoicing: reuse `OrgSettings` name/address, add a `PayrollSettings` singleton | One place to edit the company, no duplicate address to drift, while payroll-only statutory identifiers get their own home |
| 7 | Separate `Employee` model, not a fourth `AccountType` | `Vendor` has ~50 columns meaningless for staff, a PENDING/APPROVED lifecycle that does not describe employment, and relations to bills and invoices. Folding staff in would leak them into every existing `prisma.vendor` query |
| 8 | Pure calc function plus snapshot on finalize | Immutability for free, auditability of which rates produced a figure, and a calc engine testable without a database. Raising a rate cannot retroactively alter an issued payslip |
| 9 | Effective-dated `SalaryRecord` timeline | Increments, back-dating and month-accurate lookups all fall out of one mechanism, with no "current salary disagrees with history log" failure mode |
| 10 | Auto-prorate partial months by calendar days | Standard Malaysian practice; one code path covers mid-month join, mid-month exit and mid-month raises |
| 11 | Add vitest, covering only the pure payroll modules | This is the first money math in the codebase. A wrong band or a misapplied flag produces a plausible payslip that under-remits |
| 12 | Employees are admin-created; no self-registration | Self-registering as someone's employee is nonsensical |

### Rejected alternatives

- **Compute on read** (derive contributions at render time from live settings) — editing a rate would silently rewrite historical payslips so they no longer match what was remitted. Disqualifying for a compliance document.
- **Versioned rate tables** with `effectiveFrom` — genuinely how large payroll systems work, but at this headcount it is a lot of machinery to obtain what decision 8's JSON snapshot already provides.
- **Percentage applied directly to salary for SOCSO/EIS** — off by cents against the statutory table (26.50 vs 26.25).
- **Generalising `TaskRowsEditor`** to serve payslip lines — would require a config-driven column system to cover date-vs-label, three line kinds and three flag checkboxes. Two focused components are better.

## 3. Data model

All changes are additive. Nothing existing is modified except one enum value and one optional relation.

### Enums

```prisma
enum UserRole { ADMIN  VENDOR  STAFF }   // STAFF is new

enum EmploymentStatus  { ACTIVE  RESIGNED  TERMINATED }
enum PayrollRunStatus  { DRAFT  FINALIZED }
enum StatutoryBandType   { SOCSO  EIS }
enum StatutoryBandSource { GENERATED  MANUAL }

enum PayslipLineKind {
  EARNING          // adds to gross; the three flags select which bases it feeds
  WAGE_DEDUCTION   // reduces gross and each flagged base (unpaid leave, no-pay day)
  NET_DEDUCTION    // reduces net only (advance recovery, staff loan, asset)
}
```

The existing `PaymentStatus` (`UNPAID` / `PAID`) is reused for payroll runs rather than duplicated.

`PayslipLineKind` is a closed three-way choice rather than a `reducesGross` boolean. Unpaid leave reduces wages and therefore lowers the EPF, SOCSO and tax bases; a loan repayment does not reduce wages and comes off net after contributions. Treating a loan repayment as a wage reduction would under-remit EPF and SOCSO. A boolean would additionally permit the nonsensical state "reduces the EPF base but is not taxable".

### Employee

```prisma
model Employee {
  id           String @id @default(cuid())
  userId       String @unique
  user         User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  employeeCode String @unique          // printed as "Employee ID"; prefix from PayrollSettings

  fullName    String
  designation String
  department  String?
  nationality String?
  gender      String?

  // Statutory identifiers, printed on the payslip
  nricOrPassport String
  epfNumber      String?
  socsoNumber    String?
  pcbNumber      String?

  email String
  phone String

  addressLine1 String?
  addressLine2 String?
  city         String?
  postcode     String?
  state        String?
  country      String?

  bankName          String
  accountNumber     String
  accountHolderName String?

  status  EmploymentStatus @default(ACTIVE)
  hiredOn DateTime
  endedOn DateTime?

  // Statutory applicability
  epfEnabled   Boolean @default(true)
  socsoEnabled Boolean @default(true)
  eisEnabled   Boolean @default(true)

  // Per-employee rate overrides (some employees elect above-statutory EPF)
  epfEmployeeRateOverride Decimal? @db.Decimal(5, 2)
  epfEmployerRateOverride Decimal? @db.Decimal(5, 2)

  monthlyZakat Decimal? @db.Decimal(14, 2)

  // PCB profile. Documentation only — see note below.
  taxResident       Boolean @default(true)
  taxWorkerCategory String? @default("Normal Worker")
  taxMaritalStatus  String?
  taxDependents     Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  salaryRecords SalaryRecord[]
  payslips      Payslip[]

  @@index([status])
}
```

Note: the PCB profile fields compute nothing. PCB is entered by hand. They exist to print footnote 2 and to record which profile the admin looked the figure up against. This is deliberate and should not be mistaken for calculation input.

`Employee` has no salary column. Salary lives entirely in `SalaryRecord`.

### SalaryRecord

```prisma
model SalaryRecord {
  id            String   @id @default(cuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  monthlySalary Decimal  @db.Decimal(14, 2)
  effectiveFrom DateTime                     // UTC day, normally the 1st
  reason        String?                      // "Annual increment 2026", "Promotion to Senior"
  createdAt     DateTime @default(now())

  @@index([employeeId, effectiveFrom])
}
```

Salary for a month M is the latest record with `effectiveFrom <= start of M`. A single source of truth, so there is no mutable-field-versus-audit-log divergence.

This yields: an increment recorded once as effective 2026-05-01 flows into May's run automatically and leaves April's untouched; full raise history with amount, date and reason on the employee page; hiring as simply the first record; and correct figures when drafting a month either side of a raise, because the lookup is by month rather than by "now".

This does not contradict rejecting versioned rate tables. Statutory rates are only ever asked about *through* a payslip, which the finalize snapshot answers. Salary is asked about independently ("what is their salary now", "when was the last raise") and is needed *before* any payslip for that month exists, so it earns a real timeline.

### PayrollRun

```prisma
model PayrollRun {
  id     String           @id @default(cuid())
  year   Int
  month  Int                                  // 1-12
  status PayrollRunStatus @default(DRAFT)

  issuedOn    DateTime?
  finalizedAt DateTime?

  paymentStatus    PaymentStatus @default(UNPAID)
  paidAt           DateTime?
  paymentReference String?

  rateSnapshot Json?                          // frozen at finalize

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payslips Payslip[]

  @@unique([year, month])
}
```

`@@unique([year, month])` makes double-running a month impossible at the database level.

### Payslip

```prisma
model Payslip {
  id         String     @id @default(cuid())
  runId      String
  run        PayrollRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  employeeId String
  employee   Employee   @relation(fields: [employeeId], references: [id], onDelete: Restrict)

  payslipNumber String @unique                // PS-{YYYY}-{MM}-{employeeCode}

  // Employee facts copied at finalize
  employeeName   String
  designation    String
  department     String?
  nationality    String?
  gender         String?
  nricOrPassport String
  epfNumber      String?
  socsoNumber    String?
  pcbNumber      String?

  // Computed figures, all snapshotted
  grossPay   Decimal @db.Decimal(14, 2)
  taxablePay Decimal @db.Decimal(14, 2)
  epfBase    Decimal @db.Decimal(14, 2)
  socsoBase  Decimal @db.Decimal(14, 2)

  epfEmployee   Decimal @default(0) @db.Decimal(14, 2)
  epfEmployer   Decimal @default(0) @db.Decimal(14, 2)
  socsoEmployee Decimal @default(0) @db.Decimal(14, 2)
  socsoEmployer Decimal @default(0) @db.Decimal(14, 2)
  eisEmployee   Decimal @default(0) @db.Decimal(14, 2)
  eisEmployer   Decimal @default(0) @db.Decimal(14, 2)
  zakat         Decimal @default(0) @db.Decimal(14, 2)
  pcb           Decimal @default(0) @db.Decimal(14, 2)
  hrdfEmployer  Decimal @default(0) @db.Decimal(14, 2)

  totalEmployeeDeductions Decimal @db.Decimal(14, 2)
  totalEmployerCost       Decimal @db.Decimal(14, 2)
  netPay                  Decimal @db.Decimal(14, 2)

  proratedDays Int?
  daysInMonth  Int?

  pdfPath String?
  notes   String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  lines PayslipLine[]

  @@unique([runId, employeeId])
  @@index([employeeId])
}
```

Employee facts are duplicated onto `Payslip` deliberately: if someone is promoted in June, May's payslip must still show their May designation.

### PayslipLine

```prisma
model PayslipLine {
  id        String  @id @default(cuid())
  payslipId String
  payslip   Payslip @relation(fields: [payslipId], references: [id], onDelete: Cascade)

  kind   PayslipLineKind
  label  String
  units  Decimal? @db.Decimal(10, 2)
  rate   Decimal? @db.Decimal(14, 2)
  amount Decimal  @db.Decimal(14, 2)

  taxable         Boolean @default(true)
  epfApplicable   Boolean @default(true)
  socsoApplicable Boolean @default(true)

  sortOrder Int @default(0)

  @@index([payslipId])
}
```

Basic salary is itself an auto-created `EARNING` line rather than a separate column, so earnings have exactly one representation.

### StatutoryBand

```prisma
model StatutoryBand {
  id             String            @id @default(cuid())
  type           StatutoryBandType
  wageFrom       Decimal           @db.Decimal(14, 2)
  wageTo         Decimal           @db.Decimal(14, 2)
  employeeAmount Decimal           @db.Decimal(14, 2)
  employerAmount Decimal           @db.Decimal(14, 2)
  source         StatutoryBandSource @default(GENERATED)

  @@unique([type, wageFrom])
  @@index([type])
}
```

`StatutoryBandType` can gain an `EPF` value later with no schema change, should cent-exact EPF Third Schedule behaviour ever be wanted (see section 5).

### PayrollSettings

See section 5.

### Changes to existing models

```prisma
model User {
  // ...
  employee Employee?   // new
}
```

## 4. Calculation engine

`src/lib/payroll/calc.ts` — no Prisma imports, no I/O, fully testable.

```ts
computePayslip(input: {
  lines: LineInput[];            // includes the already-prorated salary line
  employee: EmployeeCalcFacts;   // flags, EPF overrides, elected zakat, hand-entered PCB
  config: RateConfig;            // rates plus SOCSO/EIS bands
}): PayslipCalcOutput
```

### Order of operations

```
grossPay   = SUM(EARNING)                  - SUM(WAGE_DEDUCTION)
taxablePay = SUM(EARNING where taxable)    - SUM(WAGE_DEDUCTION where taxable)
epfBase    = SUM(EARNING where epfApp)     - SUM(WAGE_DEDUCTION where epfApp)
socsoBase  = SUM(EARNING where socsoApp)   - SUM(WAGE_DEDUCTION where socsoApp)

epfEmployee  = ceilToRinggit(epfBase x (override ?? epfEmployeeRate))
epfEmployer  = ceilToRinggit(epfBase x (override ?? employerRateFor(epfBase)))
socso        = bandLookup(SOCSO, socsoBase) -> { employee, employer }
eis          = bandLookup(EIS,   socsoBase) -> { employee, employer }
zakat        = employee.monthlyZakat
pcb          = employee.pcb                      // hand-entered
hrdfEmployer = hrdfEnabled ? grossPay x hrdfRate : 0

totalEmployeeDeductions = epfEmployee + socsoEmployee + eisEmployee
                        + zakat + pcb + SUM(NET_DEDUCTION)
netPay                  = grossPay - totalEmployeeDeductions
totalEmployerCost       = grossPay + epfEmployer + socsoEmployer
                        + eisEmployer + hrdfEmployer
```

`employerRateFor(base)` returns `epfEmployerRateBelowThreshold` when `base <= epfEmployerThreshold`, otherwise `epfEmployerRate`. The EPF employer rate is 13% for monthly wages up to RM5,000 and 12% above; the reference shows 12% only because 5300 exceeds the threshold. A single employer-rate field would silently underpay every employee earning RM5,000 or less.

EIS deliberately looks up against `socsoBase` rather than a base of its own: EIS uses the same wage definition as SOCSO under Malaysian law. This is intentional, not a copy-paste.

`bandLookup` clamps above the highest band rather than returning zero — that is how the SOCSO and EIS wage ceilings behave, and a miss returning zero would silently zero a contribution.

When `epfEnabled`, `socsoEnabled` or `eisEnabled` is false, the corresponding figures are zero and the others are unaffected.

### Traced against the reference

Gross 5300 with no allowances yields EPF 583.00 / 636.00, SOCSO 26.25 / 91.85, EIS 10.50 / 10.50, Zakat 0.00, PCB 130.50, HRDF 0.00, total employee deductions 750.25, net pay 4549.75, taxable pay 5300.00. Every figure matches.

### Integer cents

`5300 * 0.11` evaluates to `583.0000000000001` in JavaScript. The engine converts every input to integer cents at its boundary, performs all arithmetic in integers, and returns cents; a formatter converts out. Nothing float-shaped reaches Prisma or the PDF. EPF's round-up-to-the-next-ringgit becomes `ceil(cents / 100) * 100`.

This is the single most important implementation rule in the module.

### Proration

`src/lib/payroll/proration.ts`, also pure:

```ts
prorateSalaryForMonth(params: {
  year: number;
  month: number;
  salaryRecords: { monthlySalary: number; effectiveFrom: Date }[];
  hiredOn: Date;
  endedOn?: Date | null;
}): { amount: number; proratedDays: number; daysInMonth: number }
```

Walks each UTC calendar day of the month, determines whether the employee was employed that day and which `SalaryRecord` was in effect, accumulates a daily rate of `monthlySalary / daysInMonth`, and rounds once at the end. Twenty-eight to thirty-one iterations, and it collapses mid-month join, mid-month exit and multiple raises within one month into a single code path with no special cases. The segment-based alternative is faster and is where off-by-one bugs live.

Reuses the existing UTC helpers in `src/lib/billingDates.ts`, whose own comment warns about exactly this timezone drift.

### File layout

```
src/lib/payroll/
  money.ts           pure        toCents, fromCents, ceilToRinggit, roundTo5Sen
  calc.ts            pure        computePayslip
  proration.ts       pure        prorateSalaryForMonth
  payslipNumber.ts   pure        PS-{YYYY}-{MM}-{employeeCode}
  bands.ts           pure        generateBands(rates) -> Band[]
  rates.ts           server-only PayrollSettings + StatutoryBand -> RateConfig
  run.ts             server-only draft / finalize orchestration
```

Only `rates.ts` and `run.ts` touch Prisma. The five pure modules are the entire test surface.

## 5. Settings and configurability

Every rate, threshold and ceiling is admin-configurable. The mechanism differs by deduction because the statutes differ.

**Applied directly to a base:** EPF and HRDF. The configured percentage multiplies the base.

**Used to generate a band table:** SOCSO and EIS. The percentage cannot be applied directly to salary — 5300 x 0.5% = 26.50, whereas the statutory figure is 26.25, because it derives from the band midpoint. A "Regenerate bands from rates" admin action rebuilds `StatutoryBand` from the configured rates, ceiling and band width, using:

```
bandMidpoint x rate, rounded to the nearest 5 sen
```

This rule was inferred from the reference payslip and verified against all three of its data points. For the 5,200.01-5,300.00 band, midpoint 5,250:

| | Computed | Reference |
| --- | --- | --- |
| SOCSO employee | 5250 x 0.5% = 26.25 | 26.25 |
| SOCSO employer | 5250 x 1.75% = 91.875 -> 91.85 | 91.85 |
| EIS (each side) | 5250 x 0.2% = 10.50 | 10.50 |

The band *ceiling* would give 26.50 rather than 26.25, so midpoint is confirmed rather than guessed.

### Admin ownership of the band tables

Generation is a starting point, not the authority. The admin owns these tables and is expected to reconcile them against the official PERKESO schedule, so the design makes the distinction visible rather than assuming the generated values are correct:

- Every `StatutoryBand` row carries `source`: `GENERATED` when produced by the rule, `MANUAL` once an admin has edited it. The band editor shows this per row, so a hand-corrected band is never silently overwritten by a later regeneration — regeneration rewrites `GENERATED` rows and leaves `MANUAL` rows alone.
- `bandsVerifiedAt` and `bandsVerifiedBy` record that an admin has checked the whole table against the official schedule. While `bandsVerifiedAt` is null, the payroll pages carry a persistent warning that the tables are generated and unverified, and finalizing a run requires an explicit acknowledgement checkbox. It warns rather than blocks — blocking would make the portal unusable until someone finds the PDF.
- The band editor supports CSV import, so the admin can transcribe the official schedule wholesale instead of editing sixty-odd rows by hand. Imported rows land as `MANUAL`.
- Regenerating bands never affects finalized runs, because those carry their own `rateSnapshot`.

This keeps every figure configurable — which was the requirement — while making it unambiguous which numbers carry statutory authority and which are the software's best guess.

**Entered by hand:** PCB, per employee per month. **Employee-elected fixed amount:** Zakat.

```prisma
model PayrollSettings {
  id String @id @default("singleton")

  // Employer statutory identifiers
  employeeCodePrefix  String  @default("G6-EMP-")
  businessRegNumber   String?
  epfEmployerNumber   String?
  socsoEmployerNumber String?
  lhdnEmployerNumber  String?

  // EPF / KWSP — applied directly to epfBase
  epfEmployeeRate               Decimal @default(11.00) @db.Decimal(5, 2)
  epfEmployerRate               Decimal @default(12.00) @db.Decimal(5, 2)
  epfEmployerRateBelowThreshold Decimal @default(13.00) @db.Decimal(5, 2)
  epfEmployerThreshold          Decimal @default(5000.00) @db.Decimal(14, 2)

  // SOCSO — rates generate the band table
  socsoEmployeeRate Decimal @default(0.500) @db.Decimal(5, 3)
  socsoEmployerRate Decimal @default(1.750) @db.Decimal(5, 3)
  socsoWageCeiling  Decimal @default(6000.00) @db.Decimal(14, 2)
  socsoBandWidth    Decimal @default(100.00) @db.Decimal(14, 2)

  // EIS — rates generate the band table
  eisEmployeeRate Decimal @default(0.200) @db.Decimal(5, 3)
  eisEmployerRate Decimal @default(0.200) @db.Decimal(5, 3)
  eisWageCeiling  Decimal @default(6000.00) @db.Decimal(14, 2)
  eisBandWidth    Decimal @default(100.00) @db.Decimal(14, 2)

  // HRDF — employer-only levy on gross
  hrdfEnabled Boolean @default(false)
  hrdfRate    Decimal @default(1.00) @db.Decimal(5, 2)

  // Payslip design
  payslipLogoUrl            String?
  accentColor               String  @default("#18181b")
  showEmployerContributions Boolean @default(true)
  showHrdfColumn            Boolean @default(false)
  showZakatColumn           Boolean @default(true)
  epfFootnote               String?
  payslipFooterText         String?

  bandsGeneratedAt DateTime?
  bandsVerifiedAt  DateTime?
  bandsVerifiedBy  String?
  updatedAt        DateTime @updatedAt
}
```

Rates use `Decimal(5,3)` so 0.500, 1.750 and 0.200 are held exactly.

`showHrdfColumn` defaults to false to match `hrdfEnabled` defaulting to false — an HRDF column of 0.00 is noise for an employer that does not pay the levy. The reference payslip shows the column because that employer renders it regardless. `showZakatColumn` defaults true, as the reference does.

Company name and address come from the existing `OrgSettings` singleton, since the employing entity is the same one that appears as Bill To on vendor invoices. Only payroll-specific identifiers live here.

### A known precision caveat

EPF is technically band-based as well — the Third Schedule uses RM20 wage bands. The reference's figures land exactly because 5300 is a band boundary; at a salary of 5,290 the table gives 583.00 while the percentage gives 581.90. The reference's own footnote describes EPF as a percentage, so this design implements the percentage with EPF's round-up-to-next-ringgit rule and surfaces the caveat in the settings UI. Should cent-exact EPF ever be required, `StatutoryBandType` accepts an `EPF` value with no schema change and the generic band machinery already handles it.

## 6. Flows

### Generate

Admin picks a month and generates. The run drafts one payslip per employee employed on any day of that month, so mid-month joiners and leavers are included and prorated. Each payslip receives an auto-created "Salary" earning line at the prorated amount, then `computePayslip` fills in every figure. Re-running generate on a draft run refreshes it; on a finalized run it is blocked.

### Review

Where PCB is entered, and where allowances, overtime, back-pay arrears and loan deductions are added as lines.

### Finalize

Validated before locking:

- net pay must be non-negative on every payslip (a negative net means deductions exceed pay — block rather than emit)
- PCB entered, or explicitly confirmed zero, for each employee
- EPF and SOCSO numbers present wherever the corresponding deduction is enabled
- the run is non-empty

Then a single transaction sets `FINALIZED`, writes `finalizedAt`, `issuedOn` and `rateSnapshot`. PDFs render *after* the transaction, sequentially, following the pattern `createInvoiceSubmission` already uses.

Known failure mode: if rendering fails partway, payslips are locked with some `pdfPath` still null. A "Regenerate missing PDFs" admin action covers this. Rendering inside the transaction would be worse — N renders holding a database transaction open against a 300-second function ceiling.

### Back-dated increments

A raise agreed in May but effective in March, with March and April already finalized: locked runs stay locked, and the admin adds a **back-pay arrears** earning line to the current month, flagged taxable and EPF-able. This is both standard Malaysian practice and correct tax treatment, since arrears are taxed in the month actually paid. Unlocking and reissuing would mean reissuing payslips staff already hold and abandoning the immutability decision 3 exists to provide.

### Mark paid

After finalizing, the admin records a payment date and reference against the run. Staff payslip lists show paid versus unpaid.

## 7. UI

### Admin

| Route | Purpose |
| --- | --- |
| `/admin/staff` | List: name, code, designation, department, status, current salary |
| `/admin/staff/new` | Create `Employee` + `User(role: STAFF)` + first `SalaryRecord`, admin-set initial password. Mirrors `/admin/vendors/new` |
| `/admin/staff/[id]` | Profile, statutory identifiers, salary history with "Record increment", payslip history |
| `/admin/staff/[id]/edit` | Edit employee fields |
| `/admin/payroll` | Runs by year and month with status and totals; "Generate <Month>" |
| `/admin/payroll/[runId]` | The run: one row per employee (gross, EPF, SOCSO, EIS, PCB, net), inline PCB entry, per-payslip edit, Finalize, Mark Paid |
| `/admin/payroll/[runId]/payslips/[id]/edit` | Line editor and notes |
| `/admin/payroll-settings` | Tabs: Employer details, Rates, SOCSO bands, EIS bands, Payslip design. Band tabs show per-row `source`, support CSV import and "Regenerate from rates", and carry the verification stamp |

### Staff

| Route | Purpose |
| --- | --- |
| `/staff` | Dashboard: designation, latest payslip, net pay, download |
| `/staff/payslips` | Finalized payslips only — drafts must never be visible |
| `/staff/profile` | Contact and bank details, password change (reuses `PasswordChangeForm`) |

### API

`GET /api/payslips/[id]/pdf` streams from blob storage. Permitted for `ADMIN`, or for the owning `STAFF` user and only when the run is finalized. Same shape as `src/app/api/invoices/[id]/pdf/route.ts`.

### Server actions

`src/actions/staff.ts`: `createEmployee`, `updateEmployee`, `setEmploymentStatus`, `recordSalaryChange`, `staffUpdateProfile`.

`src/actions/payroll.ts`: `generatePayrollRun`, `updatePayslipLines`, `finalizePayrollRun`, `markRunPaid`, `regenerateMissingPdfs`, `updatePayrollSettings`, `regenerateStatutoryBands`, `updateStatutoryBand`.

All follow the existing `(prevState, formData) => FormState` shape used with `useActionState`, with zod validation and a `fieldErrors` map keyed by the first path segment.

### PDF

`src/lib/pdf/templates/PayslipClassic.tsx`, a `PayslipPdfData` type in `src/lib/pdf/types.ts`, and `renderPayslipPdf()` added to `src/lib/pdf/render.tsx`. Reproduces the reference layout: employer block, eight-field employee grid, Gross Earnings, the employee/employer contributions matrix, Net and Taxable pay, and numbered footnotes. Footnote 1 is generated from the EPF rates actually used; footnote 2 from the PCB profile fields.

Design knobs read from `PayrollSettings`: logo, accent colour, whether employer contributions are shown, whether the HRDF and Zakat columns are shown, footnote override and footer text.

### Reuse

Reused as-is: `savePdf` / `readUploadedFile` from `src/lib/storage.ts`, `getOrgSettings()`, `AppShell`, `FormField`, `Badge`, `StatCard`, and the `MarkPaidInline` pattern from `src/app/admin/vendors/[id]/MarkPaidForms.tsx` for Mark Run Paid.

New rather than generalised: `PayslipLinesEditor` follows `TaskRowsEditor`'s JSON-in-a-hidden-field pattern as a sibling component.

### Changes to existing code

1. `UserRole` gains `STAFF`; `User` gains `employee Employee?`
2. `loginUser` redirect becomes three-way — `src/actions/auth.ts:116`
3. `src/middleware.ts` — add a `/staff/:path*` matcher and a STAFF branch
4. `src/lib/currentUser.ts` — add `requireStaff()`
5. Admin navigation gains Staff, Payroll and Payroll Settings, reaching eight items. This begins to want grouping; left flat for now and flagged.
6. `src/lib/pdf/render.tsx` and `src/lib/pdf/types.ts` — additive only

`getOrgFinancialSummary()` is deliberately untouched. Payroll is a different ledger from accounts-payable, and folding salaries into the same "Outstanding" figure as vendor bills would make that number meaningless. Payroll totals live on the payroll pages.

## 8. Testing

This is the first money math in the codebase, which currently has no tests, no test runner and no test script. A wrong band or a misapplied flag produces a plausible-looking payslip that under-remits, so the calculation engine gets real coverage.

Add `vitest` and a `vitest.config.ts` carrying the `@/` alias, with `"test": "vitest run"`. Tests are colocated. **Only the pure payroll modules are tested** — no database tests, no component tests, and no retrofitting of the existing application.

The reference payslip is the golden fixture: 5300 in must produce 583.00 / 636.00 / 26.25 / 91.85 / 10.50 / 10.50 / 130.50, total deductions 750.25, net 4549.75 — exactly.

Further cases:

- **EPF** — 13% below the RM5,000 threshold (4500 yields 585.00 employer), the boundary at exactly 5000, round-up-to-ringgit, per-employee override, `epfEnabled: false`
- **Flags** — a non-EPF-able earning raises gross but not `epfBase`; `taxable: false` makes gross differ from taxable pay
- **`NET_DEDUCTION` leaves every base untouched while `WAGE_DEDUCTION` reduces them.** The most important test in the suite, since this distinction is what prevents under-remitting
- **Bands** — lookup at exact band boundaries; clamping above the wage ceiling rather than returning zero; `generateBands` from default rates reproduces the reference figures
- **Proration** — mid-month join, mid-month exit, join and leave in the same month, a raise mid-month, two raises in one month, 28/29/31-day denominators, per-day cent drift
- **Float safety** — a salary such as 3333.33 that produces artifacts under naive float arithmetic
- **Negative net** detection
- **money.ts** — `toCents`/`fromCents` round-trip; `ceilToRinggit` leaves an exact ringgit unchanged (583.00 stays 583.00, not 584.00); `roundTo5Sen`
- **payslipNumber.ts** — format and zero-padded month

## 9. Migration and rollout

All migrations are additive: new models, one enum value, one optional relation on `User`. No backfill, no dropped columns, and nothing touching `Vendor`, `Bill` or `InvoiceSubmission`. Existing vendor flows cannot regress because no existing query changes.

One wrinkle: `ALTER TYPE ... ADD VALUE` for `STAFF` cannot run inside a transaction on some PostgreSQL versions. The emitted migration must be checked and possibly split.

The SOCSO and EIS bands are seeded by a dedicated migration rather than `prisma/seed.ts`, so production receives them without anyone remembering a setup step.

### Build order

1. vitest plus `money.ts`, `calc.ts`, `proration.ts`, `bands.ts`, `payslipNumber.ts` with their tests — no database, no UI
2. Schema migration, band seed, `PayrollSettings`
3. `rates.ts` and `run.ts` orchestration
4. `PayslipClassic` template, `renderPayslipPdf`, and a development preview route to compare against the reference
5. Admin staff CRUD and salary records
6. Payroll run: generate, review, finalize
7. Payroll settings UI including the band editor
8. Staff portal and the payslip PDF route
9. Mark run paid

Phase 1 comes first deliberately: the calculation engine is provable in isolation, and every later phase inherits its correctness.

## 10. Security

Payslips are the most sensitive data this application will hold: NRIC, EPF and SOCSO numbers, and salary.

- Blob storage stays `access: "private"`; files are served only through the authenticated route, never by exposing a blob URL
- Staff scoping is enforced in every query (`where: { employeeId }`), not delegated to middleware — matching how vendor scoping already works alongside `requireVendor()`
- Draft payslips are invisible to staff; only finalized runs are readable
- No staff-facing list of other employees anywhere in the portal
- `rateSnapshot` holds rates and bands only, never secrets

## 11. Out of scope

Year-to-date figures on payslips; bank bulk-payment file export; Form EA annual statements; leave and attendance tracking; claims and reimbursement workflow; multi-currency; email notification of payslips (no SMTP is wired up anywhere in this application); automatic PCB calculation.

Each of these is recorded with its rough shape, dependencies and reason for deferral in `docs/payroll-future-plans.md`.

## 12. Items requiring verification before production payroll

1. **The generated SOCSO and EIS band tables must be reconciled against the official PERKESO schedule.** The generation rule was inferred from a single reference payslip and verified against three data points. That is strong evidence, not authority, and trusting a reverse-engineered rule is exactly how a compliance bug reaches production. The workflow in section 5 puts this in the admin's hands: generated rows are marked as such, the table can be CSV-imported from the official schedule, and the portal warns on every payroll page until someone stamps `bandsVerifiedAt`. The software should not be the last word on a statutory figure.
2. **EPF rates and the RM5,000 employer threshold** should be confirmed against the current EPF Third Schedule at implementation time.
3. **HRDF applicability** — whether the entity is PSMB-registered with ten or more employees. This is a settings toggle defaulting to false, so it needs confirming before the first real run rather than before implementation.
4. **The EPF percentage-versus-Third-Schedule caveat** in section 5 should be an explicit, accepted trade-off rather than an implementation detail.
