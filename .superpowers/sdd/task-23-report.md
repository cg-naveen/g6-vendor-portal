# Task 23 Report

- Status: Complete
- Commit: `11ece76 feat(payroll): record payment against a finalized run`
- Implemented: `MarkRunPaidForm` with inline open/closed pattern (paidAt + optional paymentReference, no amount/fee); wired into run detail page with paid-status panel.
- Verification: `npm test` passed (75 tests).
- Verification: `npx tsc --noEmit` passed.
- Verification: `npm run lint` passed with 0 errors and 11 pre-existing warnings.
- Verification: `npm run build` passed.
- Concerns: Browser scenarios from the brief (mark paid, badge flip, `/staff/payslips` revalidation) were not exercised manually — no admin/staff test session available.

## Whole-branch critical fixes

- Draft PCB and manual-line mutations now lock and guard the run as DRAFT through recomputation; a concurrent finalize returns the finalized FormState error without partial writes.
- Payroll generation now holds the same DRAFT run lock across stale-payslip deletion and every payslip refresh.
- Finalization now loads one rate config, recomputes all payslips with it inside the locking transaction, re-validates, then stores that exact config in `rateSnapshot` during the DRAFT-to-FINALIZED transition.
- Verification: `npm test` passed (75 tests); `npx tsc --noEmit` passed; targeted ESLint passed.
- Remaining concern: PDF EPF footnotes still use live payroll settings (the optional snapshot-backed rendering change was not included).
