# Payroll — Future Plans

Deferred scope from the full-time staff payroll build. See `docs/superpowers/specs/2026-09-22-full-time-staff-payroll-design.md` for what is being built now.

Nothing here is committed work. Each item records why it was deferred, its rough shape, and what it depends on, so the decision does not have to be re-derived later.

## 1. Year-to-date figures on payslips

**Shape.** Year-to-date gross, EPF, SOCSO, EIS and PCB accumulated across finalized runs, printed on each payslip.

**Why deferred.** The reference payslip does not show them, so they were not required to match the target layout.

**Depends on.** Nothing beyond the initial build. Once runs are locked, YTD is a sum over finalized payslips for the employee within the calendar year — genuinely cheap. This is the strongest candidate to add first, since staff and tax filing both routinely want it.

**Note.** YTD must be computed from *finalized* runs only, or a draft would pollute historical figures.

## 2. Bank bulk-payment file export

**Shape.** Generate a bulk-credit file from a finalized run so a whole month is paid in one upload — Maybank2u Biz and CIMB BizChannel being the likely targets.

**Why deferred.** Each bank publishes its own fixed-width or CSV specification, and getting one wrong means a failed or misrouted payment run. Higher blast radius than anything else on this list.

**Depends on.** Finalized runs (exists after the initial build), plus complete and validated employee bank details. Would also want the account-number format validated per bank at entry time rather than at export time.

**Note.** Decide one bank first and do it properly rather than a generic exporter.

## 3. Form EA annual statement

**Shape.** The statement every Malaysian employer must furnish each employee by the end of February, covering the preceding calendar year.

**Why deferred.** It is a separate multi-section statutory PDF with its own rules and its own benefit categories — realistically its own project, and one that only becomes useful after a full year of payroll has actually run.

**Depends on.** A complete calendar year of finalized runs. Also depends on benefit-in-kind and perquisite categories that the current `PayslipLine` model does not classify — EA requires certain items broken out separately, so line labels alone will not be enough. Expect a taxonomy field on `PayslipLine` when this is picked up.

## 4. Leave and attendance tracking

**Shape.** Leave entitlement, balances, applications and approvals; attendance or timesheets feeding unpaid-leave deductions automatically.

**Why deferred.** Out of the requested scope, and a substantial subsystem in its own right.

**Depends on.** Nothing technically — the initial build already accepts unpaid leave as a `WAGE_DEDUCTION` line entered by hand, which is the integration point. Leave tracking would simply generate those lines instead of the admin typing them.

**Note.** If this is ever wanted, scope it as its own project. Leave rules (carry-forward, proration on join, statutory minimums by service length) are more intricate than they appear.

## 5. Claims and reimbursement workflow

**Shape.** Staff submit expense claims with receipts; admin approves; approved claims flow onto the payslip.

**Why deferred.** Out of the requested scope.

**Depends on.** The initial build's line model already handles the output — a reimbursement is an `EARNING` line flagged non-taxable, non-EPF-able and non-SOCSO-able, which is exactly why those flags are per-line. The missing part is the submission and approval workflow plus receipt upload.

**Note.** Receipt upload can reuse `saveUploadedFile` and the authenticated-stream route pattern already used for vendor bills.

## 6. Multi-currency

**Shape.** Salaries and payslips denominated in currencies other than the implicit local one.

**Why deferred.** The whole application is currently unit-less — `formatMoney` emits plain numbers with no currency symbol, for vendors as much as for staff. This is a pre-existing gap noted in the README, not a payroll-specific one.

**Depends on.** A currency decision for the application as a whole. Statutory deductions are inherently MYR-denominated, so a foreign-currency salary would need a conversion policy and a recorded rate per payslip before EPF or SOCSO could be computed at all. Not a small change.

## 7. Email notification

**Shape.** Notify staff when a payslip is issued; optionally attach or link it.

**Why deferred.** No SMTP or email provider is wired up anywhere in this application.

**Depends on.** An email provider. Worth noting this is not payroll-specific — the same gap means vendors are never told when they are approved or rejected, and password reset links are rendered on-screen instead of emailed, which the README already flags as not production-secure. One provider integration unblocks all three.

**Note.** If email is added, payslip notification should link to the portal rather than attach the PDF. Payslips carry NRIC, EPF and SOCSO numbers, and email is a poor channel for that.

## 8. Automatic PCB calculation

**Shape.** Compute the monthly tax deduction from the LHDN Monthly Tax Deduction rules instead of the admin entering it.

**Why deferred.** Requires a full employee tax profile — residency, worker category, marital status, spouse employment, dependent children, prior-year reliefs, the EPF relief cap, and accumulated year-to-date tax. The formula must also be re-verified after every Budget, so it is ongoing maintenance rather than a one-off build.

**Depends on.** Extending the tax profile fields on `Employee` from documentation into actual calculation inputs. The fields already exist (`taxResident`, `taxWorkerCategory`, `taxMaritalStatus`, `taxDependents`) and currently only print footnote 2 on the payslip, so the schema groundwork is partly there.

**Note.** Even if built, keep the manual override. Admin should always be able to enter the figure they were actually instructed to deduct.

## 9. Cent-exact EPF via the Third Schedule

**Shape.** Replace the EPF percentage calculation with the EPF Third Schedule wage-band table.

**Why deferred.** The reference payslip's own footnote describes EPF as a percentage, and the initial build implements it that way with EPF's round-up-to-next-ringgit rule. The figures diverge only for salaries that are not on a RM20 band boundary — 5,290 gives 583.00 by table and 581.90 by percentage.

**Depends on.** Nothing structural. `StatutoryBandType` accepts an `EPF` value with no schema change, and the generic band lookup and band editor already handle it. This is close to a drop-in if it is ever needed.

## 10. Admin navigation grouping

**Shape.** Group the admin sidebar into sections rather than a flat list.

**Why deferred.** Cosmetic, and better judged once the payroll pages actually exist.

**Depends on.** Nothing. The initial build takes the admin sidebar to eight flat items (Pending Approvals, All Vendors, All Invoices, Staff, Payroll, Payroll Settings, Billing Settings, Profile), which is where a flat list starts to strain. `AppShell`'s `NavItem` list would need an optional group label.
