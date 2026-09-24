# Full-Time Staff Support & Monthly Payslips — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full-time employees and monthly payroll to the G6 Vendor Portal, producing Malaysian statutory payslips that reconcile to the cent with what is remitted to EPF, PERKESO and LHDN.

**Architecture:** A dependency-free calculation engine (pure functions over integer sen) is built and unit-tested first, before any database or UI work. Monthly `PayrollRun` batches draft one `Payslip` per employee, the admin reviews and enters PCB, and finalizing locks the run — writing every computed figure to real columns plus a JSON snapshot of the rate config used, so later rate changes can never rewrite an issued payslip. Salary lives in an effective-dated `SalaryRecord` timeline so increments and partial months resolve by month rather than by "now".

**Tech Stack:** Next.js 16.2.10 (App Router, Server Actions), React 19.2.4, TypeScript 5, Prisma 6.19 + PostgreSQL, `@react-pdf/renderer` 4.5, Tailwind CSS v4, zod 4, Vercel Blob, vitest (added by Task 1).

**Spec:** `docs/superpowers/specs/2026-09-22-full-time-staff-payroll-design.md` — read it before starting. This plan argues from that spec; where they disagree, the spec is right and the plan has a bug worth reporting.

## Global Constraints

Every task's requirements implicitly include this section.

**Read the bundled Next.js docs before writing route, page or action code.** `AGENTS.md` mandates this: "This version has breaking changes — APIs, conventions, and file structure may all differ from your training data." Relevant files:
- Server Actions: `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`
- Mutating data: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Revalidating: `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`
- Route handlers: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Dynamic route params: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
- Forms: `node_modules/next/dist/docs/01-app/02-guides/forms.md`

**Money.** All currency arithmetic happens in integer sen. `5300 * 0.11` evaluates to `583.0000000000001` in JavaScript. Never apply `+ - * /` directly to a ringgit amount; convert with `toCents` first. Nothing float-shaped may reach Prisma or the PDF.

**Purity.** `src/lib/payroll/{types,money,bands,calc,proration,payslipNumber}.ts` must have **zero** imports from `@prisma/client`, `next/*`, `server-only`, or anything doing I/O. They are the unit-test surface. `rates.ts` and `run.ts` may use Prisma and must start with `import "server-only";`.

**Server actions.** Signature `(prevState: FormState, formData: FormData) => Promise<FormState>` where `FormState = { error?: string; success?: boolean; fieldErrors?: Record<string, string> }`. Validate with zod. Build `fieldErrors` keyed by `String(issue.path[0] ?? "form")`, first issue per key wins. Mirror `src/actions/admin.ts`.

**Authorization.** Every admin action and page begins `await requireAdmin()`. Every staff action and page begins `await requireStaff()`. Middleware is defence in depth, never the only check — and every staff-facing query is additionally scoped `where: { employeeId }`. Mirror how `requireVendor()` and per-query scoping already work together in `src/actions/tasks.ts`.

**Dates.** Use the UTC helpers in `src/lib/billingDates.ts` (`startOfUtcDay`, `parseDateInput`). Never `getMonth()`/`getDate()` on a local-time `Date` — that file's own comment warns about the drift this caused before.

**Decimal.** Prisma `Decimal` values are objects, not numbers. Always `Number(...)` at the read boundary.

**Styling.** Use only the `g6-*` component classes already defined in `src/app/globals.css` (`g6-card`, `g6-panel`, `g6-btn`, `g6-btn-primary`, `g6-btn-secondary`, `g6-btn-ghost`, `g6-btn-danger`, `g6-btn-sm`, `g6-input`, `g6-input-error`, `g6-label`, `g6-help-error`, `g6-table`, `g6-table-wrap`, `g6-badge`, `g6-page-title`, `g6-page-subtitle`, `g6-section-label`, `g6-kpi-label`, `g6-kpi-value`, `g6-nav-link`, `g6-prose`, `font-mono-g6`). If a new class is genuinely needed, add it inside the existing `@layer components` block.

**Migrations.** Hand-written SQL at `prisma/migrations/<UTC timestamp>_<snake_name>/migration.sql`. Read `prisma/migrations/20260907150000_add_vendor_code/migration.sql` for the house style — commented sections, explicit `CREATE INDEX`.

**Blob storage.** Always `access: "private"` via `savePdf`/`saveUploadedFile` in `src/lib/storage.ts`. Blob URLs are never sent to a client; files are streamed through authenticated routes only.

**Commit after every task.** Conventional Commits. End every commit message with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Exact statutory values (copy verbatim; do not round or "correct" these)

| Setting | Default |
| --- | --- |
| `epfEmployeeRate` | `11.00` |
| `epfEmployerRate` (above threshold) | `12.00` |
| `epfEmployerRateBelowThreshold` (at or below) | `13.00` |
| `epfEmployerThreshold` | `5000.00` |
| `socsoEmployeeRate` | `0.500` |
| `socsoEmployerRate` | `1.750` |
| `socsoWageCeiling` | `6000.00` |
| `socsoBandWidth` | `100.00` |
| `eisEmployeeRate` | `0.200` |
| `eisEmployerRate` | `0.200` |
| `eisWageCeiling` | `6000.00` |
| `eisBandWidth` | `100.00` |
| `hrdfEnabled` | `false` |
| `hrdfRate` | `1.00` |
| `employeeCodePrefix` | `"G6-EMP-"` |

**Band generation rule:** `bandMidpoint x rate`, **floored** to 5 sen. Flooring (not rounding to nearest) is what reproduces the reference; nearest would give 91.90 instead of 91.85.

**Payslip number format:** `PS-{YYYY}-{MM}-{employeeCode}`, month zero-padded.

### The golden fixture

Every figure below comes from the reference payslip in spec section 1 and must be reproduced exactly. Task 5 asserts all of it.

Gross 5300.00, single salary line, all three flags true, EPF/SOCSO/EIS all enabled, no overrides, zakat 0, PCB 130.50, HRDF disabled:

| Field | Expected |
| --- | --- |
| `grossPay` | 5300.00 |
| `taxablePay` | 5300.00 |
| `epfEmployee` | 583.00 |
| `epfEmployer` | 636.00 |
| `socsoEmployee` | 26.25 |
| `socsoEmployer` | 91.85 |
| `eisEmployee` | 10.50 |
| `eisEmployer` | 10.50 |
| `zakat` | 0.00 |
| `pcb` | 130.50 |
| `hrdfEmployer` | 0.00 |
| `totalEmployeeDeductions` | 750.25 |
| `netPay` | 4549.75 |

---

## File Structure

### Created — pure engine (unit-tested, no I/O)

| File | Responsibility |
| --- | --- |
| `src/lib/payroll/types.ts` | Shared pure types: `Band`, `LineKind`, `LineInput`, `RateConfig`, `EmployeeCalcFacts`, `PayslipCalcOutput` |
| `src/lib/payroll/money.ts` | Sen conversion and the three rounding rules |
| `src/lib/payroll/bands.ts` | `generateBands`, `findBand` |
| `src/lib/payroll/calc.ts` | `computePayslip` — the whole statutory calculation |
| `src/lib/payroll/proration.ts` | `prorateSalaryForMonth` |
| `src/lib/payroll/payslipNumber.ts` | `formatPayslipNumber`, `formatEmployeeCode` |

### Created — server-only

| File | Responsibility |
| --- | --- |
| `src/lib/payroll/rates.ts` | Load `PayrollSettings` + `StatutoryBand` into a `RateConfig`; snapshot/restore it |
| `src/lib/payroll/run.ts` | Draft and finalize orchestration; PDF regeneration |
| `src/lib/payroll/payslipPdf.ts` | `buildPayslipPdfData` — stored payslip to formatted template input |
| `src/lib/payrollSettings.ts` | `getPayrollSettings()` singleton accessor, mirroring `src/lib/orgSettings.ts` |
| `src/lib/employeeCode.ts` | `generateEmployeeCode()` — next sequential code with the configured prefix |
| `scripts/generate-band-sql.ts` | Emits the band seed SQL from `generateBands`, so seed and engine cannot disagree |

### Created — PDF

| File | Responsibility |
| --- | --- |
| `src/lib/pdf/templates/PayslipClassic.tsx` | The single payslip template, faithful to the reference |

### Created — actions

| File | Responsibility |
| --- | --- |
| `src/actions/staff.ts` | Employee CRUD, salary records, staff self-service profile |
| `src/actions/payroll.ts` | Generate, PCB, edit lines, finalize, regenerate PDFs, mark paid |
| `src/actions/payrollSettings.ts` | Employer details, rates, payslip design |
| `src/actions/statutoryBands.ts` | Regenerate, edit, CSV import, verification stamp |

Deviation from the spec, noted deliberately: spec section 7 puts settings and
band actions in `src/actions/payroll.ts`. Splitting them into three files keeps
each focused — `payroll.ts` mutates runs, the other two mutate configuration —
and none of them grows past a screenful of related handlers.

### Created — validation

| File | Responsibility |
| --- | --- |
| `src/lib/payrollValidation.ts` | zod schemas for employees, salary records, payslip lines, settings, bands |

### Created — admin pages

`src/app/admin/staff/page.tsx`, `new/page.tsx` + `AddStaffForm.tsx`, `[id]/page.tsx` + `SalaryHistorySection.tsx` + `EmploymentStatusForm.tsx`, `[id]/edit/page.tsx` + `EditStaffForm.tsx`.

`src/app/admin/payroll/page.tsx` + `GenerateRunForm.tsx`, `[id]/page.tsx` + `PcbInlineInput.tsx` + `FinalizeRunForm.tsx` + `RegeneratePdfsButton.tsx` + `MarkRunPaidForm.tsx`.

`src/app/admin/payroll/[id]/payslips/[payslipId]/edit/page.tsx` + `[payslipId]/PayslipLinesEditor.tsx`.

`src/app/admin/payroll-settings/page.tsx` + `EmployerDetailsForm.tsx`, `RatesForm.tsx`, `BandEditor.tsx`, `PayslipDesignForm.tsx`.

### Created — staff pages

`src/app/staff/{layout,page,payslips/page,profile/page}.tsx` plus `StaffProfileForm.tsx`.

### Created — API

`src/app/api/payslips/[id]/pdf/route.ts`, and (development only) `src/app/api/dev/payslip-preview/route.ts`.

### Modified

| File | Change |
| --- | --- |
| `package.json` | Add `vitest` devDependency and `test` / `test:watch` scripts |
| `vitest.config.ts` | Created — `@/` alias, node environment |
| `prisma/schema.prisma` | New enums and models; `STAFF` on `UserRole`; `employee Employee?` on `User` |
| `src/lib/currentUser.ts` | Add `requireStaff()` |
| `src/middleware.ts` | `/staff/:path*` matcher and STAFF branch |
| `src/actions/auth.ts:116` | Three-way login redirect |
| `src/lib/pdf/types.ts` | Add `PayslipPdfData` |
| `src/lib/pdf/render.tsx` | Add `renderPayslipPdf` |
| `src/app/admin/layout.tsx` | Nav: Staff, Payroll, Payroll Settings |
| `src/components/Badge.tsx` | Add `employeeStatusVariant` |

**Not modified:** `src/lib/stats.ts`. Payroll is a separate ledger from accounts-payable; folding salaries into the same "Outstanding" figure as vendor bills would make that number meaningless.

---
# Phase 1 — Pure calculation engine

No database, no UI. The engine is proven correct in isolation because every later phase inherits its correctness.

## Task 1: Test runner and money helpers

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/payroll/types.ts`
- Create: `src/lib/payroll/money.ts`
- Test: `src/lib/payroll/money.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `toCents(amount: number): number` — ringgit to integer sen
  - `fromCents(cents: number): number` — sen to ringgit
  - `pctOfCents(cents: number, ratePercent: number): number` — possibly-fractional sen
  - `ceilToRinggit(cents: number): number` — integer sen
  - `floorTo5Sen(cents: number): number` — integer sen
  - `sumCents(values: number[]): number`
  - types `Band`, `LineKind`, `LineInput`, `RateConfig`, `EmployeeCalcFacts`, `PayslipCalcOutput`

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest@^3
```

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, after `"lint": "eslint"`, add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Only the pure payroll modules are unit-tested. See the plan's Global
    // Constraints: anything importing Prisma, next/* or server-only is out of scope.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: Create `src/lib/payroll/types.ts`**

```ts
/**
 * Pure types for the payroll calculation engine. This file must never import
 * from @prisma/client — the engine is deliberately decoupled from persistence
 * so it can be unit-tested without a database.
 *
 * Every monetary value here is in RINGGIT (not sen). Conversion to sen happens
 * inside the calculation modules; sen never leak across these boundaries.
 */

export type Band = {
  /** Exclusive lower bound. A wage w falls in this band when wageFrom < w <= wageTo. */
  wageFrom: number;
  /** Inclusive upper bound. */
  wageTo: number;
  employeeAmount: number;
  employerAmount: number;
};

export type LineKind =
  /** Adds to gross; the three flags select which bases it feeds. */
  | "EARNING"
  /** Reduces gross and each flagged base (unpaid leave, no-pay day). */
  | "WAGE_DEDUCTION"
  /** Reduces net only, after contributions (advance recovery, staff loan). */
  | "NET_DEDUCTION";

export type LineInput = {
  kind: LineKind;
  amount: number;
  taxable: boolean;
  epfApplicable: boolean;
  socsoApplicable: boolean;
};

export type RateConfig = {
  epfEmployeeRate: number;
  /** Applies when the EPF base is ABOVE epfEmployerThreshold. */
  epfEmployerRate: number;
  /** Applies when the EPF base is AT OR BELOW epfEmployerThreshold. */
  epfEmployerRateBelowThreshold: number;
  epfEmployerThreshold: number;
  hrdfEnabled: boolean;
  hrdfRate: number;
  socsoBands: Band[];
  eisBands: Band[];
};

export type EmployeeCalcFacts = {
  epfEnabled: boolean;
  socsoEnabled: boolean;
  eisEnabled: boolean;
  epfEmployeeRateOverride: number | null;
  epfEmployerRateOverride: number | null;
  /** Employee-elected fixed monthly amount, not a computed figure. */
  monthlyZakat: number;
  /** Hand-entered by admin from the LHDN schedule. The engine never derives this. */
  pcb: number;
};

export type PayslipCalcOutput = {
  grossPay: number;
  taxablePay: number;
  epfBase: number;
  socsoBase: number;
  epfEmployee: number;
  epfEmployer: number;
  socsoEmployee: number;
  socsoEmployer: number;
  eisEmployee: number;
  eisEmployer: number;
  zakat: number;
  pcb: number;
  hrdfEmployer: number;
  totalEmployeeDeductions: number;
  totalEmployerCost: number;
  netPay: number;
};
```

- [ ] **Step 5: Write the failing test**

Create `src/lib/payroll/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ceilToRinggit, floorTo5Sen, fromCents, pctOfCents, sumCents, toCents } from "./money";

describe("toCents", () => {
  it("converts whole ringgit", () => {
    expect(toCents(5300)).toBe(530000);
  });

  it("converts amounts that float arithmetic would mangle", () => {
    // 0.1 * 100 === 10.000000000000002 in raw JS
    expect(toCents(0.1)).toBe(10);
    expect(toCents(3333.33)).toBe(333333);
    expect(toCents(91.875)).toBe(9188);
  });

  it("round-trips through fromCents", () => {
    expect(fromCents(toCents(4549.75))).toBe(4549.75);
  });
});

describe("pctOfCents", () => {
  it("is exact for the EPF employee rate", () => {
    expect(pctOfCents(530000, 11)).toBe(58300);
  });

  it("is exact for the EPF employer rate", () => {
    expect(pctOfCents(530000, 12)).toBe(63600);
  });

  it("returns fractional sen for the SOCSO employer rate", () => {
    expect(pctOfCents(525000, 1.75)).toBe(9187.5);
  });

  it("is exact for a rate that is not representable in binary floating point", () => {
    // 0.2 cannot be represented exactly; a naive cents * 0.2 / 100 drifts.
    expect(pctOfCents(525000, 0.2)).toBe(1050);
  });

  it("is exact for the SOCSO employee rate", () => {
    expect(pctOfCents(525000, 0.5)).toBe(2625);
  });
});

describe("ceilToRinggit", () => {
  it("leaves an exact ringgit alone", () => {
    // EPF rounds UP to the next ringgit, so 583.00 must stay 583.00, not become 584.00
    expect(ceilToRinggit(58300)).toBe(58300);
  });

  it("rounds a part-ringgit up", () => {
    expect(ceilToRinggit(58190)).toBe(58200);
    expect(ceilToRinggit(58101)).toBe(58200);
  });

  it("rounds fractional sen up", () => {
    expect(ceilToRinggit(58100.5)).toBe(58200);
  });

  it("leaves zero alone", () => {
    expect(ceilToRinggit(0)).toBe(0);
  });
});

describe("floorTo5Sen", () => {
  it("floors the SOCSO employer figure from the reference payslip", () => {
    // 91.875 -> 91.85. Rounding to NEAREST 5 sen would give 91.90 and contradict
    // the reference, which is why this floors.
    expect(floorTo5Sen(9187.5)).toBe(9185);
  });

  it("leaves a figure already on a 5 sen boundary alone", () => {
    expect(floorTo5Sen(2625)).toBe(2625);
    expect(floorTo5Sen(1050)).toBe(1050);
  });

  it("absorbs the float dust left by pctOfCents-style products", () => {
    expect(floorTo5Sen(1050.0000000000002)).toBe(1050);
  });
});

describe("sumCents", () => {
  it("sums an empty list to zero", () => {
    expect(sumCents([])).toBe(0);
  });

  it("sums without drift", () => {
    expect(sumCents([58300, 2625, 1050, 13050])).toBe(75025);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

```bash
npm test -- src/lib/payroll/money.test.ts
```

Expected: FAIL — `Failed to resolve import "./money"`.

- [ ] **Step 7: Implement `src/lib/payroll/money.ts`**

```ts
/**
 * Currency helpers for payroll.
 *
 * Every figure is handled as an integer number of sen internally. `5300 * 0.11`
 * evaluates to 583.0000000000001 in JavaScript, and a payslip that is off by a
 * fraction of a sen is a payslip that does not reconcile with what was actually
 * remitted to EPF, PERKESO or LHDN.
 *
 * Convention: `toCents` takes a ringgit INPUT. `pctOfCents`, `ceilToRinggit` and
 * `floorTo5Sen` operate on sen and tolerate fractional sen, because intermediate
 * products legitimately produce them (RM91.875). They always return integer sen.
 */

/** Ringgit to integer sen. Rounds half away from zero. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Integer sen back to ringgit, for display and for Prisma Decimal columns. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Applies a percentage rate to a sen amount, returning possibly-fractional sen.
 *
 * The rate is scaled to an integer thousandth-of-a-percent first so the whole
 * multiplication stays in integers and only the final division introduces a
 * fraction. A naive `cents * rate / 100` drifts for rates like 0.2, which has no
 * exact binary representation: 525000 * 0.2 === 105000.00000000001.
 */
export function pctOfCents(cents: number, ratePercent: number): number {
  const milliPercent = Math.round(ratePercent * 1000);
  return (cents * milliPercent) / 100000;
}

/**
 * Rounds up to the next whole ringgit — the EPF rule. An amount already on an
 * exact ringgit must stay put, so 58300 sen stays 58300 rather than becoming 58400.
 */
export function ceilToRinggit(cents: number): number {
  return Math.ceil(cents / 100) * 100;
}

/**
 * Floors to a 5 sen boundary — the granularity PERKESO publishes SOCSO and EIS
 * figures at. RM91.875 becomes RM91.85.
 *
 * The epsilon nudge absorbs float dust: a product that should be exactly 1050
 * can arrive as 1050.0000000000002, and a bare floor would drop it to 1045.
 */
export function floorTo5Sen(cents: number): number {
  return Math.floor(cents / 5 + 1e-9) * 5;
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
```

- [ ] **Step 8: Run the test to verify it passes**

```bash
npm test -- src/lib/payroll/money.test.ts
```

Expected: PASS, 17 tests.

- [ ] **Step 9: Verify the pure modules stayed pure**

```bash
grep -rnE "from \"(@prisma|next|server-only)" src/lib/payroll/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/payroll/
git commit -m "$(cat <<'MSG'
feat(payroll): add vitest and integer-sen money helpers

First money math in the codebase, so it gets a test runner. Every payroll
figure is handled as integer sen: 5300 * 0.11 is 583.0000000000001 in JS and
a payslip off by a fraction of a sen does not reconcile with what is remitted.

pctOfCents scales the rate to integer thousandths of a percent before
multiplying, because rates like 0.2 have no exact binary representation.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: Statutory band generation and lookup

**Files:**
- Create: `src/lib/payroll/bands.ts`
- Test: `src/lib/payroll/bands.test.ts`

**Interfaces:**
- Consumes: `toCents`, `fromCents`, `pctOfCents`, `floorTo5Sen` from `./money`; type `Band` from `./types`
- Produces:
  - `generateBands(params: { employeeRate: number; employerRate: number; wageCeiling: number; bandWidth: number }): Band[]`
  - `findBand(bands: Band[], wage: number): Band | null` — clamps to the highest band above the ceiling; returns `null` for a non-positive wage or an empty table

- [ ] **Step 1: Write the failing test**

Create `src/lib/payroll/bands.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findBand, generateBands } from "./bands";
import type { Band } from "./types";

const SOCSO = { employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 };
const EIS = { employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 };

describe("generateBands", () => {
  it("produces one band per bandWidth up to the ceiling", () => {
    expect(generateBands(SOCSO)).toHaveLength(60);
  });

  it("covers wages as half-open intervals starting at zero", () => {
    const [first, second] = generateBands(SOCSO);
    expect(first.wageFrom).toBe(0);
    expect(first.wageTo).toBe(100);
    expect(second.wageFrom).toBe(100);
    expect(second.wageTo).toBe(200);
  });

  it("ends exactly on the ceiling", () => {
    const bands = generateBands(SOCSO);
    expect(bands[bands.length - 1].wageTo).toBe(6000);
  });

  it("reproduces the reference payslip's SOCSO figures from the band midpoint", () => {
    // The reference employee earns 5300, which falls in the 5200-5300 band,
    // midpoint 5250. Employee 5250 x 0.5% = 26.25; employer 5250 x 1.75% =
    // 91.875 floored to 5 sen = 91.85. Using the band CEILING would give 26.50.
    const band = findBand(generateBands(SOCSO), 5300);
    expect(band?.wageFrom).toBe(5200);
    expect(band?.wageTo).toBe(5300);
    expect(band?.employeeAmount).toBe(26.25);
    expect(band?.employerAmount).toBe(91.85);
  });

  it("reproduces the reference payslip's EIS figures", () => {
    const band = findBand(generateBands(EIS), 5300);
    expect(band?.employeeAmount).toBe(10.5);
    expect(band?.employerAmount).toBe(10.5);
  });

  it("never emits a negative or NaN amount", () => {
    for (const band of generateBands(SOCSO)) {
      expect(band.employeeAmount).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(band.employeeAmount)).toBe(true);
      expect(Number.isFinite(band.employerAmount)).toBe(true);
    }
  });
});

describe("findBand", () => {
  const bands = generateBands(SOCSO);

  it("treats the lower bound as exclusive and the upper as inclusive", () => {
    expect(findBand(bands, 100)?.wageFrom).toBe(0);
    expect(findBand(bands, 100.01)?.wageFrom).toBe(100);
  });

  it("clamps to the highest band above the wage ceiling", () => {
    // A miss must NOT return null here — returning nothing would silently zero
    // the contribution for every high earner.
    const band = findBand(bands, 25000);
    expect(band?.wageFrom).toBe(5900);
    expect(band?.wageTo).toBe(6000);
  });

  it("returns the ceiling band for a wage exactly at the ceiling", () => {
    expect(findBand(bands, 6000)?.wageTo).toBe(6000);
  });

  it("returns null for a non-positive wage", () => {
    expect(findBand(bands, 0)).toBeNull();
    expect(findBand(bands, -50)).toBeNull();
  });

  it("returns null for an empty table", () => {
    expect(findBand([], 5300)).toBeNull();
  });

  it("works on a hand-edited table whose rows are out of order", () => {
    // Admins may edit bands by hand, and a CSV import makes no ordering promise.
    const shuffled: Band[] = [
      { wageFrom: 200, wageTo: 300, employeeAmount: 1.25, employerAmount: 4.35 },
      { wageFrom: 0, wageTo: 100, employeeAmount: 0.25, employerAmount: 0.85 },
      { wageFrom: 100, wageTo: 200, employeeAmount: 0.75, employerAmount: 2.6 },
    ];
    expect(findBand(shuffled, 150)?.wageFrom).toBe(100);
    expect(findBand(shuffled, 999)?.wageFrom).toBe(200);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/payroll/bands.test.ts
```

Expected: FAIL — `Failed to resolve import "./bands"`.

- [ ] **Step 3: Implement `src/lib/payroll/bands.ts`**

```ts
import { floorTo5Sen, fromCents, pctOfCents, toCents } from "./money";
import type { Band } from "./types";

/**
 * Generates a SOCSO or EIS contribution table from configured rates.
 *
 * SOCSO and EIS are published by PERKESO as wage-band tables, not as
 * percentages applied to salary: the statutory figure is derived from the
 * band's MIDPOINT. For the 5200-5300 band the midpoint is 5250, giving an
 * employee contribution of 26.25 rather than the 26.50 that 0.5% of 5300 would
 * suggest. This midpoint rule was confirmed against all three statutory figures
 * on the reference payslip.
 *
 * The result is a starting point, not an authority — see the spec's section 12.
 * Generated rows are stored with source GENERATED so an admin's hand-corrected
 * rows survive regeneration.
 */
export function generateBands(params: {
  employeeRate: number;
  employerRate: number;
  wageCeiling: number;
  bandWidth: number;
}): Band[] {
  const { employeeRate, employerRate, wageCeiling, bandWidth } = params;
  if (bandWidth <= 0 || wageCeiling <= 0) return [];

  const bands: Band[] = [];
  for (let from = 0; from < wageCeiling; from += bandWidth) {
    const to = Math.min(from + bandWidth, wageCeiling);
    const midpointCents = toCents(from + (to - from) / 2);
    bands.push({
      wageFrom: from,
      wageTo: to,
      employeeAmount: fromCents(floorTo5Sen(pctOfCents(midpointCents, employeeRate))),
      employerAmount: fromCents(floorTo5Sen(pctOfCents(midpointCents, employerRate))),
    });
  }
  return bands;
}

/**
 * Finds the band a wage falls into, treating each band as (wageFrom, wageTo].
 *
 * A wage above the highest band CLAMPS to that band rather than missing. This is
 * how the SOCSO and EIS wage ceilings behave, and a miss returning null would
 * silently zero the contribution for every employee above the ceiling — a
 * failure that produces a plausible-looking payslip.
 *
 * Bands are not assumed to be sorted: they are admin-editable and may arrive
 * from a CSV import in any order.
 */
export function findBand(bands: Band[], wage: number): Band | null {
  if (bands.length === 0 || wage <= 0) return null;

  const match = bands.find((band) => wage > band.wageFrom && wage <= band.wageTo);
  if (match) return match;

  return bands.reduce((highest, band) => (band.wageTo > highest.wageTo ? band : highest));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/payroll/bands.test.ts
```

Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payroll/
git commit -m "$(cat <<'MSG'
feat(payroll): generate and look up SOCSO/EIS wage bands

SOCSO and EIS are published as wage-band tables, not percentages applied to
salary: the figure derives from the band MIDPOINT. For the 5200-5300 band that
is 5250, giving employee 26.25 rather than the 26.50 that 0.5% of 5300 implies.
Confirmed against all three statutory figures on the reference payslip.

findBand clamps above the top band instead of missing. A miss returning null
would silently zero the contribution for every earner above the wage ceiling.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
## Task 3: The payslip calculation

The core of the feature. Not split across tasks: a half-implemented `computePayslip` is not independently reviewable, and each partial step would rewrite the same function.

**Files:**
- Create: `src/lib/payroll/calc.ts`
- Test: `src/lib/payroll/calc.test.ts`

**Interfaces:**
- Consumes: `findBand` from `./bands`; `ceilToRinggit`, `fromCents`, `pctOfCents`, `sumCents`, `toCents` from `./money`; `generateBands` from `./bands` (tests only); all types from `./types`
- Produces: `computePayslip(input: { lines: LineInput[]; employee: EmployeeCalcFacts; config: RateConfig }): PayslipCalcOutput`

- [ ] **Step 1: Write the failing test**

Create `src/lib/payroll/calc.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateBands } from "./bands";
import { computePayslip } from "./calc";
import { toCents } from "./money";
import type { EmployeeCalcFacts, LineInput, RateConfig } from "./types";

const config: RateConfig = {
  epfEmployeeRate: 11,
  epfEmployerRate: 12,
  epfEmployerRateBelowThreshold: 13,
  epfEmployerThreshold: 5000,
  hrdfEnabled: false,
  hrdfRate: 1,
  socsoBands: generateBands({ employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 }),
  eisBands: generateBands({ employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 }),
};

const employee: EmployeeCalcFacts = {
  epfEnabled: true,
  socsoEnabled: true,
  eisEnabled: true,
  epfEmployeeRateOverride: null,
  epfEmployerRateOverride: null,
  monthlyZakat: 0,
  pcb: 0,
};

/** A fully statutory-applicable earning line, which is what basic salary is. */
function salary(amount: number): LineInput {
  return { kind: "EARNING", amount, taxable: true, epfApplicable: true, socsoApplicable: true };
}

function run(lines: LineInput[], facts: Partial<EmployeeCalcFacts> = {}, cfg: Partial<RateConfig> = {}) {
  return computePayslip({
    lines,
    employee: { ...employee, ...facts },
    config: { ...config, ...cfg },
  });
}

describe("computePayslip — the reference payslip", () => {
  it("reproduces every figure on the reference payslip exactly", () => {
    const result = run([salary(5300)], { pcb: 130.5 });

    expect(result).toEqual({
      grossPay: 5300,
      taxablePay: 5300,
      epfBase: 5300,
      socsoBase: 5300,
      epfEmployee: 583,
      epfEmployer: 636,
      socsoEmployee: 26.25,
      socsoEmployer: 91.85,
      eisEmployee: 10.5,
      eisEmployer: 10.5,
      zakat: 0,
      pcb: 130.5,
      hrdfEmployer: 0,
      totalEmployeeDeductions: 750.25,
      netPay: 4549.75,
      totalEmployerCost: 6038.35,
    });
  });
});

describe("computePayslip — EPF", () => {
  it("uses the 13% employer rate at or below the threshold", () => {
    const result = run([salary(4500)]);
    expect(result.epfEmployee).toBe(495);
    expect(result.epfEmployer).toBe(585);
  });

  it("uses 13% at exactly the threshold", () => {
    expect(run([salary(5000)]).epfEmployer).toBe(650);
  });

  it("switches to 12% one sen above the threshold", () => {
    // 500001 sen x 12% = 60000.12 sen, rounded up to the next ringgit = 601.00
    expect(run([salary(5000.01)]).epfEmployer).toBe(601);
  });

  it("rounds the contribution up to the next ringgit", () => {
    // 100050 sen x 11% = 11005.5 sen -> 111.00
    expect(run([salary(1000.5)]).epfEmployee).toBe(111);
  });

  it("honours a per-employee rate override", () => {
    const result = run([salary(5300)], { epfEmployeeRateOverride: 15 });
    expect(result.epfEmployee).toBe(795);
    expect(result.epfEmployer).toBe(636);
  });

  it("zeroes EPF when disabled, leaving the other deductions alone", () => {
    const result = run([salary(5300)], { epfEnabled: false });
    expect(result.epfEmployee).toBe(0);
    expect(result.epfEmployer).toBe(0);
    expect(result.socsoEmployee).toBe(26.25);
    expect(result.eisEmployee).toBe(10.5);
  });
});

describe("computePayslip — line flags", () => {
  it("excludes a non-EPF-able earning from the EPF base but not from gross", () => {
    const allowance: LineInput = {
      kind: "EARNING",
      amount: 500,
      taxable: true,
      epfApplicable: false,
      socsoApplicable: true,
    };
    const result = run([salary(5300), allowance]);

    expect(result.grossPay).toBe(5800);
    expect(result.epfBase).toBe(5300);
    expect(result.socsoBase).toBe(5800);
    expect(result.epfEmployee).toBe(583);
  });

  it("separates taxable pay from gross pay for a non-taxable earning", () => {
    const reimbursement: LineInput = {
      kind: "EARNING",
      amount: 250,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    const result = run([salary(5300), reimbursement]);

    expect(result.grossPay).toBe(5550);
    expect(result.taxablePay).toBe(5300);
    expect(result.epfBase).toBe(5300);
  });
});

describe("computePayslip — the two deduction kinds", () => {
  it("reduces gross and every flagged base for a WAGE_DEDUCTION", () => {
    const unpaidLeave: LineInput = {
      kind: "WAGE_DEDUCTION",
      amount: 300,
      taxable: true,
      epfApplicable: true,
      socsoApplicable: true,
    };
    const result = run([salary(5300), unpaidLeave]);

    expect(result.grossPay).toBe(5000);
    expect(result.taxablePay).toBe(5000);
    expect(result.epfBase).toBe(5000);
    expect(result.socsoBase).toBe(5000);
    // The lower base now attracts the 13% employer rate, not 12%
    expect(result.epfEmployer).toBe(650);
  });

  it("leaves every base untouched for a NET_DEDUCTION and only reduces net", () => {
    // THE most important assertion in this suite. Treating a loan repayment as
    // a wage reduction would lower the EPF and SOCSO bases and under-remit.
    const loanRepayment: LineInput = {
      kind: "NET_DEDUCTION",
      amount: 300,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    const withLoan = run([salary(5300), loanRepayment], { pcb: 130.5 });
    const without = run([salary(5300)], { pcb: 130.5 });

    expect(withLoan.grossPay).toBe(5300);
    expect(withLoan.epfBase).toBe(5300);
    expect(withLoan.socsoBase).toBe(5300);
    expect(withLoan.epfEmployee).toBe(without.epfEmployee);
    expect(withLoan.socsoEmployee).toBe(without.socsoEmployee);

    expect(withLoan.totalEmployeeDeductions).toBe(1050.25);
    expect(withLoan.netPay).toBe(4249.75);
  });
});

describe("computePayslip — SOCSO and EIS", () => {
  it("clamps to the highest band above the wage ceiling", () => {
    // Band 5900-6000, midpoint 5950: employee 29.75, employer 104.10
    const result = run([salary(8000)]);
    expect(result.socsoEmployee).toBe(29.75);
    expect(result.socsoEmployer).toBe(104.1);
  });

  it("zeroes SOCSO when disabled while still computing EIS", () => {
    const result = run([salary(5300)], { socsoEnabled: false });
    expect(result.socsoEmployee).toBe(0);
    expect(result.socsoEmployer).toBe(0);
    expect(result.eisEmployee).toBe(10.5);
  });

  it("zeroes EIS when disabled while still computing SOCSO", () => {
    const result = run([salary(5300)], { eisEnabled: false });
    expect(result.eisEmployee).toBe(0);
    expect(result.socsoEmployee).toBe(26.25);
  });
});

describe("computePayslip — zakat, PCB and HRDF", () => {
  it("deducts elected zakat from net without touching any base", () => {
    const result = run([salary(5300)], { monthlyZakat: 100 });
    expect(result.zakat).toBe(100);
    expect(result.epfBase).toBe(5300);
    expect(result.netPay).toBe(4580.25);
  });

  it("charges HRDF to the employer only", () => {
    const result = run([salary(5300)], { pcb: 130.5 }, { hrdfEnabled: true });
    expect(result.hrdfEmployer).toBe(53);
    expect(result.netPay).toBe(4549.75);
    expect(result.totalEmployerCost).toBe(6091.35);
  });
});

describe("computePayslip — edge cases", () => {
  it("returns all zeroes for an empty payslip without crashing", () => {
    const result = run([]);
    expect(result.grossPay).toBe(0);
    expect(result.epfEmployee).toBe(0);
    expect(result.socsoEmployee).toBe(0);
    expect(result.netPay).toBe(0);
  });

  it("reports a negative net when deductions exceed pay", () => {
    // The engine computes it honestly; finalize refuses to issue it (Task 13).
    const advance: LineInput = {
      kind: "NET_DEDUCTION",
      amount: 6000,
      taxable: false,
      epfApplicable: false,
      socsoApplicable: false,
    };
    expect(run([salary(5300), advance]).netPay).toBeLessThan(0);
  });

  it("produces figures exact to the sen for an awkward salary", () => {
    const result = run([salary(3333.33)], { pcb: 47.15 });
    for (const [field, value] of Object.entries(result)) {
      expect(Number.isInteger(toCents(value)), `${field} = ${value} is not sen-exact`).toBe(true);
    }
    expect(result.netPay).toBeCloseTo(
      result.grossPay - result.totalEmployeeDeductions,
      10
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/payroll/calc.test.ts
```

Expected: FAIL — `Failed to resolve import "./calc"`.

- [ ] **Step 3: Implement `src/lib/payroll/calc.ts`**

```ts
import { findBand } from "./bands";
import { ceilToRinggit, fromCents, pctOfCents, sumCents, toCents } from "./money";
import type { EmployeeCalcFacts, LineInput, PayslipCalcOutput, RateConfig } from "./types";

/**
 * Sums a contribution base in sen: earnings minus wage deductions, counting only
 * the lines the predicate accepts.
 *
 * NET_DEDUCTION lines are excluded from every base by construction — they are
 * recovered from net pay after contributions, not from wages.
 */
function baseCents(lines: LineInput[], applies: (line: LineInput) => boolean): number {
  const earnings = lines.filter((line) => line.kind === "EARNING" && applies(line));
  const wageDeductions = lines.filter((line) => line.kind === "WAGE_DEDUCTION" && applies(line));

  return (
    sumCents(earnings.map((line) => toCents(line.amount))) -
    sumCents(wageDeductions.map((line) => toCents(line.amount)))
  );
}

/**
 * Computes every figure on a payslip from its lines, the employee's statutory
 * facts, and a rate configuration.
 *
 * Pure and synchronous by design: no Prisma, no I/O, no clock. The caller
 * supplies an already-prorated salary line (see proration.ts) and the PCB figure
 * the admin entered by hand. PCB is never derived here — it comes from the LHDN
 * schedule and depends on a tax profile this engine deliberately does not model.
 */
export function computePayslip(input: {
  lines: LineInput[];
  employee: EmployeeCalcFacts;
  config: RateConfig;
}): PayslipCalcOutput {
  const { lines, employee, config } = input;

  const grossCents = baseCents(lines, () => true);
  const taxableCents = baseCents(lines, (line) => line.taxable);
  const epfBaseCents = baseCents(lines, (line) => line.epfApplicable);
  const socsoBaseCents = baseCents(lines, (line) => line.socsoApplicable);

  // ── EPF ── rate-driven, each side rounded up to the next ringgit.
  // The employer rate is 13% at or below the threshold and 12% above it. A
  // single employer rate would silently underpay everyone earning <= RM5,000.
  let epfEmployeeCents = 0;
  let epfEmployerCents = 0;
  if (employee.epfEnabled && epfBaseCents > 0) {
    const employeeRate = employee.epfEmployeeRateOverride ?? config.epfEmployeeRate;
    const employerRate =
      employee.epfEmployerRateOverride ??
      (epfBaseCents <= toCents(config.epfEmployerThreshold)
        ? config.epfEmployerRateBelowThreshold
        : config.epfEmployerRate);

    epfEmployeeCents = ceilToRinggit(pctOfCents(epfBaseCents, employeeRate));
    epfEmployerCents = ceilToRinggit(pctOfCents(epfBaseCents, employerRate));
  }

  // ── SOCSO and EIS ── band lookups, both against socsoBase. EIS shares the
  // SOCSO wage definition under Malaysian law; this is intentional, not a
  // copy-paste. findBand clamps above the ceiling rather than returning null.
  const socsoWage = fromCents(socsoBaseCents);
  const socsoBand = employee.socsoEnabled ? findBand(config.socsoBands, socsoWage) : null;
  const eisBand = employee.eisEnabled ? findBand(config.eisBands, socsoWage) : null;

  const socsoEmployeeCents = socsoBand ? toCents(socsoBand.employeeAmount) : 0;
  const socsoEmployerCents = socsoBand ? toCents(socsoBand.employerAmount) : 0;
  const eisEmployeeCents = eisBand ? toCents(eisBand.employeeAmount) : 0;
  const eisEmployerCents = eisBand ? toCents(eisBand.employerAmount) : 0;

  // ── Employee-elected and hand-entered ──
  const zakatCents = toCents(employee.monthlyZakat);
  const pcbCents = toCents(employee.pcb);

  // ── HRDF ── an employer levy on gross; never reaches net pay.
  const hrdfEmployerCents =
    config.hrdfEnabled && grossCents > 0 ? Math.round(pctOfCents(grossCents, config.hrdfRate)) : 0;

  const netDeductionCents = sumCents(
    lines.filter((line) => line.kind === "NET_DEDUCTION").map((line) => toCents(line.amount))
  );

  const totalEmployeeDeductionsCents =
    epfEmployeeCents +
    socsoEmployeeCents +
    eisEmployeeCents +
    zakatCents +
    pcbCents +
    netDeductionCents;

  // Reported honestly even when negative. Task 13's finalize validation refuses
  // to issue a payslip with a negative net rather than silently clamping it.
  const netPayCents = grossCents - totalEmployeeDeductionsCents;

  const totalEmployerCostCents =
    grossCents + epfEmployerCents + socsoEmployerCents + eisEmployerCents + hrdfEmployerCents;

  return {
    grossPay: fromCents(grossCents),
    taxablePay: fromCents(taxableCents),
    epfBase: fromCents(epfBaseCents),
    socsoBase: fromCents(socsoBaseCents),
    epfEmployee: fromCents(epfEmployeeCents),
    epfEmployer: fromCents(epfEmployerCents),
    socsoEmployee: fromCents(socsoEmployeeCents),
    socsoEmployer: fromCents(socsoEmployerCents),
    eisEmployee: fromCents(eisEmployeeCents),
    eisEmployer: fromCents(eisEmployerCents),
    zakat: fromCents(zakatCents),
    pcb: fromCents(pcbCents),
    hrdfEmployer: fromCents(hrdfEmployerCents),
    totalEmployeeDeductions: fromCents(totalEmployeeDeductionsCents),
    totalEmployerCost: fromCents(totalEmployerCostCents),
    netPay: fromCents(netPayCents),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/payroll/calc.test.ts
```

Expected: PASS, 19 tests. If the golden-fixture test fails, **stop and report the diff** — do not adjust the expected values to match the code. Those numbers come from the reference payslip and are the specification.

- [ ] **Step 5: Run the whole suite**

```bash
npm test
```

Expected: PASS, 48 tests across three files (17 money, 12 bands, 19 calc).

- [ ] **Step 6: Commit**

```bash
git add src/lib/payroll/
git commit -m "$(cat <<'MSG'
feat(payroll): compute statutory payslip figures

Pure function over integer sen: no Prisma, no I/O, no clock. Takes an
already-prorated salary line plus the hand-entered PCB figure and returns
every figure a payslip prints.

Reproduces all thirteen figures on the reference payslip exactly. The EPF
employer rate switches between 13% and 12% at the RM5,000 threshold, and
SOCSO/EIS come from band lookups that clamp above the wage ceiling.

WAGE_DEDUCTION lowers the contribution bases; NET_DEDUCTION does not. That
distinction is what stops a loan repayment from under-remitting EPF and SOCSO,
and it has its own test.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
## Task 4: Partial-month proration

**Files:**
- Create: `src/lib/payroll/proration.ts`
- Test: `src/lib/payroll/proration.test.ts`

**Interfaces:**
- Consumes: `startOfUtcDay` from `@/lib/billingDates` (that file is already pure — no imports, no I/O); `fromCents`, `toCents` from `./money`
- Produces: `prorateSalaryForMonth(params: { year: number; month: number; salaryRecords: { monthlySalary: number; effectiveFrom: Date }[]; hiredOn: Date; endedOn?: Date | null }): { amount: number; proratedDays: number; daysInMonth: number }`

`month` is 1-indexed (1 = January), matching `PayrollRun.month`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/payroll/proration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { toCents } from "./money";
import { prorateSalaryForMonth } from "./proration";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** March 2026 has 31 days, and 3100 / 31 = 100 exactly — handy for clean assertions. */
const march = { year: 2026, month: 3 };
const from1st = [{ monthlySalary: 3100, effectiveFrom: utc("2026-03-01") }];

describe("prorateSalaryForMonth — whole months", () => {
  it("pays the full salary for a full month", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(3100);
    expect(result.proratedDays).toBe(31);
    expect(result.daysInMonth).toBe(31);
  });

  it("uses 28 days for a non-leap February", () => {
    const result = prorateSalaryForMonth({
      year: 2026,
      month: 2,
      salaryRecords: [{ monthlySalary: 2800, effectiveFrom: utc("2026-01-01") }],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.daysInMonth).toBe(28);
    expect(result.amount).toBe(2800);
  });

  it("uses 29 days for a leap February", () => {
    const result = prorateSalaryForMonth({
      year: 2028,
      month: 2,
      salaryRecords: [{ monthlySalary: 2900, effectiveFrom: utc("2020-01-01") }],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.daysInMonth).toBe(29);
    expect(result.amount).toBe(2900);
  });
});

describe("prorateSalaryForMonth — partial months", () => {
  it("prorates a mid-month joiner from the hire date", () => {
    // Employed 16-31 March = 16 days at 100/day
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(1600);
    expect(result.proratedDays).toBe(16);
  });

  it("prorates a mid-month leaver up to and including the end date", () => {
    // Employed 1-15 March = 15 days
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
      endedOn: utc("2026-03-15"),
    });

    expect(result.amount).toBe(1500);
    expect(result.proratedDays).toBe(15);
  });

  it("handles joining and leaving within the same month", () => {
    // Employed 10-20 March inclusive = 11 days
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-03-10"),
      endedOn: utc("2026-03-20"),
    });

    expect(result.amount).toBe(1100);
    expect(result.proratedDays).toBe(11);
  });
});

describe("prorateSalaryForMonth — salary changes", () => {
  it("splits the month across a mid-month increment", () => {
    // 1-20 March at 3100 (100/day) = 2000; 21-31 at 6200 (200/day) = 2200
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4200);
    expect(result.proratedDays).toBe(31);
  });

  it("handles two increments in one month", () => {
    // 1-20 at 100/day = 2000; 21-25 at 200/day = 1000; 26-31 at 300/day = 1800
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
        { monthlySalary: 9300, effectiveFrom: utc("2026-03-26") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4800);
  });

  it("resolves by month, not by wall clock — a future increment is ignored", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
        { monthlySalary: 9300, effectiveFrom: utc("2026-05-01") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(3100);
  });

  it("uses a record that predates the hire date, from the hire date onward", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 3100, effectiveFrom: utc("2025-06-01") }],
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(1600);
  });

  it("accepts records in any order", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [
        { monthlySalary: 6200, effectiveFrom: utc("2026-03-21") },
        { monthlySalary: 3100, effectiveFrom: utc("2026-03-01") },
      ],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(4200);
  });
});

describe("prorateSalaryForMonth — nothing to pay", () => {
  it("pays nothing when no salary record is yet effective", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 3100, effectiveFrom: utc("2026-06-01") }],
      hiredOn: utc("2026-01-01"),
    });

    expect(result.amount).toBe(0);
    expect(result.proratedDays).toBe(0);
  });

  it("pays nothing when the employee had not yet joined", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2026-07-01"),
    });

    expect(result.amount).toBe(0);
  });

  it("pays nothing when the employee had already left", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: from1st,
      hiredOn: utc("2020-01-01"),
      endedOn: utc("2026-01-31"),
    });

    expect(result.amount).toBe(0);
  });

  it("pays nothing with no salary records at all", () => {
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [],
      hiredOn: utc("2020-01-01"),
    });

    expect(result.amount).toBe(0);
  });
});

describe("prorateSalaryForMonth — rounding", () => {
  it("rounds once at the end rather than once per day", () => {
    // 5000 / 31 = 16129.032... sen per day. Sixteen days is 258064.516 sen,
    // which rounds to 2580.65. Rounding each day first would give 2580.64.
    const result = prorateSalaryForMonth({
      ...march,
      salaryRecords: [{ monthlySalary: 5000, effectiveFrom: utc("2026-03-01") }],
      hiredOn: utc("2026-03-16"),
    });

    expect(result.amount).toBe(2580.65);
  });

  it("always returns a sen-exact amount", () => {
    for (let day = 1; day <= 31; day++) {
      const result = prorateSalaryForMonth({
        ...march,
        salaryRecords: [{ monthlySalary: 5333.33, effectiveFrom: utc("2026-03-01") }],
        hiredOn: new Date(Date.UTC(2026, 2, day)),
      });
      expect(Number.isInteger(toCents(result.amount))).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/payroll/proration.test.ts
```

Expected: FAIL — `Failed to resolve import "./proration"`.

- [ ] **Step 3: Implement `src/lib/payroll/proration.ts`**

```ts
import { startOfUtcDay } from "@/lib/billingDates";
import { fromCents, toCents } from "./money";

/**
 * Works out what salary a month owes an employee, prorating for partial months.
 *
 * Walks every calendar day of the month and asks two questions per day: was the
 * employee employed, and which SalaryRecord was in effect? Twenty-eight to
 * thirty-one iterations, which is free, and it collapses mid-month joins,
 * mid-month exits and any number of mid-month increments into one code path
 * with no special cases. The segment-based alternative is faster and is where
 * off-by-one bugs live.
 *
 * All comparisons are on UTC day boundaries via startOfUtcDay, because the
 * deployment target is Vercel and local-time date maths drifts there. The same
 * lesson is recorded in the header comment of src/lib/billingDates.ts.
 *
 * Accrual happens in fractional sen and is rounded exactly once, at the end.
 * Rounding per day would drift: 5000 / 31 is 16129.032 sen, and sixteen days of
 * that is 2580.65, not the 2580.64 that sixteen pre-rounded days would give.
 *
 * @param month 1-indexed, matching PayrollRun.month.
 */
export function prorateSalaryForMonth(params: {
  year: number;
  month: number;
  salaryRecords: { monthlySalary: number; effectiveFrom: Date }[];
  hiredOn: Date;
  endedOn?: Date | null;
}): { amount: number; proratedDays: number; daysInMonth: number } {
  const { year, month, salaryRecords, hiredOn, endedOn } = params;

  // Day 0 of the following month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const hiredAt = startOfUtcDay(hiredOn).getTime();
  const endedAt = endedOn ? startOfUtcDay(endedOn).getTime() : null;

  // Newest first, so the first match walking the list is the record in effect.
  const records = salaryRecords
    .map((record) => ({
      cents: toCents(record.monthlySalary),
      effectiveAt: startOfUtcDay(record.effectiveFrom).getTime(),
    }))
    .sort((a, b) => b.effectiveAt - a.effectiveAt);

  let accruedCents = 0;
  let proratedDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayAt = Date.UTC(year, month - 1, day);

    if (dayAt < hiredAt) continue;
    if (endedAt !== null && dayAt > endedAt) continue;

    const record = records.find((candidate) => candidate.effectiveAt <= dayAt);
    if (!record) continue;

    accruedCents += record.cents / daysInMonth;
    proratedDays++;
  }

  return {
    amount: fromCents(Math.round(accruedCents)),
    proratedDays,
    daysInMonth,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/payroll/proration.test.ts
```

Expected: PASS, 17 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/payroll/
git commit -m "$(cat <<'MSG'
feat(payroll): prorate salary across partial months

Walks each UTC calendar day of the month asking whether the employee was
employed and which SalaryRecord was in effect. One code path covers mid-month
joins, mid-month exits and any number of mid-month increments.

Accrues in fractional sen and rounds once at the end: 5000/31 is 16129.032 sen
a day, and sixteen days of that is 2580.65, not the 2580.64 that per-day
rounding gives.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 5: Payslip and employee code formatting

**Files:**
- Create: `src/lib/payroll/payslipNumber.ts`
- Test: `src/lib/payroll/payslipNumber.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `formatPayslipNumber(year: number, month: number, employeeCode: string): string`
  - `formatEmployeeCode(prefix: string, sequence: number): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/payroll/payslipNumber.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatEmployeeCode, formatPayslipNumber } from "./payslipNumber";

describe("formatPayslipNumber", () => {
  it("builds PS-{YYYY}-{MM}-{employeeCode}", () => {
    expect(formatPayslipNumber(2024, 11, "G6-EMP-009")).toBe("PS-2024-11-G6-EMP-009");
  });

  it("zero-pads a single-digit month", () => {
    expect(formatPayslipNumber(2026, 3, "G6-EMP-001")).toBe("PS-2026-03-G6-EMP-001");
  });

  it("does not pad December", () => {
    expect(formatPayslipNumber(2026, 12, "G6-EMP-001")).toBe("PS-2026-12-G6-EMP-001");
  });
});

describe("formatEmployeeCode", () => {
  it("pads the sequence to three digits", () => {
    expect(formatEmployeeCode("G6-EMP-", 9)).toBe("G6-EMP-009");
  });

  it("leaves a three-digit sequence alone", () => {
    expect(formatEmployeeCode("G6-EMP-", 123)).toBe("G6-EMP-123");
  });

  it("does not truncate beyond three digits", () => {
    expect(formatEmployeeCode("G6-EMP-", 1234)).toBe("G6-EMP-1234");
  });

  it("respects a configured prefix", () => {
    expect(formatEmployeeCode("TS-EMP-", 9)).toBe("TS-EMP-009");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/lib/payroll/payslipNumber.test.ts
```

Expected: FAIL — `Failed to resolve import "./payslipNumber"`.

- [ ] **Step 3: Implement `src/lib/payroll/payslipNumber.ts`**

```ts
/**
 * Payslip numbers are run-scoped rather than sequential per employee: a payslip
 * belongs to exactly one month and one employee, so year, month and employee
 * code already identify it uniquely. There is no counter to drift or reset,
 * which is the opposite of how vendor invoice numbers work (see
 * src/lib/invoiceNumber.ts, where the sequence is vendor-scoped and resettable).
 */
export function formatPayslipNumber(year: number, month: number, employeeCode: string): string {
  return `PS-${year}-${String(month).padStart(2, "0")}-${employeeCode}`;
}

/**
 * Employee codes are a configured prefix plus a zero-padded sequence, e.g.
 * G6-EMP-009. The prefix comes from PayrollSettings.employeeCodePrefix; padding
 * is to three digits and does not truncate a longer sequence.
 */
export function formatEmployeeCode(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- src/lib/payroll/payslipNumber.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Run the whole suite and confirm the engine is still pure**

```bash
npm test
grep -rnE "from \"(@prisma|next/|server-only)" src/lib/payroll/ || echo "engine is pure"
```

Expected: PASS, 72 tests (17 money, 12 bands, 19 calc, 17 proration, 7 payslipNumber), then `engine is pure`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payroll/
git commit -m "$(cat <<'MSG'
feat(payroll): format payslip numbers and employee codes

Payslip numbers are run-scoped (PS-YYYY-MM-code) rather than sequential, since
a payslip belongs to exactly one month and one employee. No counter to drift,
unlike the vendor-scoped invoice sequence.

Phase 1 complete: the calculation engine is proven against the reference
payslip with no database or UI in the picture.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Phase 2 — Schema and the STAFF role

## Task 6: Prisma schema and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_staff_payroll/migration.sql` (generated by Prisma)

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: Prisma Client models `Employee`, `SalaryRecord`, `PayrollRun`, `Payslip`, `PayslipLine`, `StatutoryBand`, `PayrollSettings`; enums `EmploymentStatus`, `PayrollRunStatus`, `PayslipLineKind`, `StatutoryBandType`, `StatutoryBandSource`; `UserRole.STAFF`; `User.employee`

- [ ] **Step 1: Add `STAFF` to `UserRole` and the back-relation on `User`**

In `prisma/schema.prisma`, change:

```prisma
enum UserRole {
  ADMIN
  VENDOR
}
```

to:

```prisma
enum UserRole {
  ADMIN
  VENDOR
  STAFF
}
```

And in `model User`, after the `vendor Vendor?` line, add:

```prisma
  employee    Employee?
```

- [ ] **Step 2: Add the new enums**

Append after the existing `enum PaymentStatus` block. Note `PaymentStatus` is **reused** for payroll runs rather than duplicated.

```prisma
enum EmploymentStatus {
  ACTIVE
  RESIGNED
  TERMINATED
}

enum PayrollRunStatus {
  DRAFT
  FINALIZED
}

/// EARNING adds to gross; the three per-line flags select which bases it feeds.
/// WAGE_DEDUCTION reduces gross and each flagged base (unpaid leave).
/// NET_DEDUCTION reduces net only, after contributions (advance recovery, loan).
/// The distinction matters: treating a loan repayment as a wage reduction would
/// lower the EPF and SOCSO bases and under-remit.
enum PayslipLineKind {
  EARNING
  WAGE_DEDUCTION
  NET_DEDUCTION
}

enum StatutoryBandType {
  SOCSO
  EIS
}

/// GENERATED rows come from the rates in PayrollSettings; MANUAL rows have been
/// edited or imported by an admin. Regeneration rewrites GENERATED rows only, so
/// a hand-corrected band is never silently clobbered.
enum StatutoryBandSource {
  GENERATED
  MANUAL
}
```

- [ ] **Step 3: Add the `Employee` model**

```prisma
model Employee {
  id           String @id @default(cuid())
  userId       String @unique
  user         User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  employeeCode String @unique

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

  // Some employees elect an above-statutory EPF rate
  epfEmployeeRateOverride Decimal? @db.Decimal(5, 2)
  epfEmployerRateOverride Decimal? @db.Decimal(5, 2)

  monthlyZakat Decimal? @db.Decimal(14, 2)

  /// PCB profile. These fields compute NOTHING — PCB is hand-entered per month.
  /// They exist to print footnote 2 on the payslip and to record which profile
  /// the admin looked the figure up against.
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

- [ ] **Step 4: Add `SalaryRecord`, `PayrollRun`, `Payslip`, `PayslipLine`**

```prisma
/// Salary is an effective-dated timeline, not a mutable column on Employee, so
/// there is no "current salary disagrees with the history log" failure mode.
/// Salary for month M is the latest record with effectiveFrom <= start of M.
model SalaryRecord {
  id            String   @id @default(cuid())
  employeeId    String
  employee      Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  monthlySalary Decimal  @db.Decimal(14, 2)
  effectiveFrom DateTime
  reason        String?
  createdAt     DateTime @default(now())

  @@index([employeeId, effectiveFrom])
}

model PayrollRun {
  id     String           @id @default(cuid())
  year   Int
  month  Int
  status PayrollRunStatus @default(DRAFT)

  issuedOn    DateTime?
  finalizedAt DateTime?

  paymentStatus    PaymentStatus @default(UNPAID)
  paidAt           DateTime?
  paymentReference String?

  /// The RateConfig actually used, frozen at finalize. This is what makes a
  /// finalized payslip immune to later rate changes.
  rateSnapshot Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  payslips Payslip[]

  @@unique([year, month])
}

model Payslip {
  id         String     @id @default(cuid())
  runId      String
  run        PayrollRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  employeeId String
  employee   Employee   @relation(fields: [employeeId], references: [id], onDelete: Restrict)

  payslipNumber String @unique

  /// Employee facts are copied here deliberately: if someone is promoted in
  /// June, May's payslip must still show their May designation.
  employeeName   String
  designation    String
  department     String?
  nationality    String?
  gender         String?
  nricOrPassport String
  epfNumber      String?
  socsoNumber    String?
  pcbNumber      String?

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
  /// Nullable on purpose: NULL means "the admin has not entered it yet", while
  /// 0.00 means "confirmed as zero". Finalize refuses to issue a payslip whose
  /// PCB is still NULL, which a @default(0) column could not express.
  pcb           Decimal? @db.Decimal(14, 2)
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

/// Basic salary is itself an auto-created EARNING line, so earnings have exactly
/// one representation rather than a column plus a list.
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

  /// True for the salary line the generator creates. Re-generating a draft run
  /// replaces only auto-generated lines, so an admin's hand-added allowance or
  /// loan deduction survives a refresh.
  autoGenerated Boolean @default(false)

  sortOrder Int @default(0)

  @@index([payslipId])
}
```

- [ ] **Step 5: Add `StatutoryBand` and `PayrollSettings`**

```prisma
/// A band covers wages in the half-open interval (wageFrom, wageTo].
model StatutoryBand {
  id             String              @id @default(cuid())
  type           StatutoryBandType
  wageFrom       Decimal             @db.Decimal(14, 2)
  wageTo         Decimal             @db.Decimal(14, 2)
  employeeAmount Decimal             @db.Decimal(14, 2)
  employerAmount Decimal             @db.Decimal(14, 2)
  source         StatutoryBandSource @default(GENERATED)

  @@unique([type, wageFrom])
  @@index([type])
}

model PayrollSettings {
  id String @id @default("singleton")

  employeeCodePrefix String @default("G6-EMP-")

  // Employer statutory identifiers. Company name and address come from
  // OrgSettings — the employing entity is the same one that appears as Bill To
  // on vendor invoices, so there is no duplicate address to drift.
  businessRegNumber   String?
  epfEmployerNumber   String?
  socsoEmployerNumber String?
  lhdnEmployerNumber  String?

  // EPF / KWSP — applied directly to the EPF base.
  // The employer rate is 13% AT OR BELOW the threshold and 12% above it.
  epfEmployeeRate               Decimal @default(11.00) @db.Decimal(5, 2)
  epfEmployerRate               Decimal @default(12.00) @db.Decimal(5, 2)
  epfEmployerRateBelowThreshold Decimal @default(13.00) @db.Decimal(5, 2)
  epfEmployerThreshold          Decimal @default(5000.00) @db.Decimal(14, 2)

  // SOCSO — these rates GENERATE the band table; they are never applied to
  // salary directly. 0.5% of 5300 is 26.50, but the statutory figure is 26.25.
  socsoEmployeeRate Decimal @default(0.500) @db.Decimal(5, 3)
  socsoEmployerRate Decimal @default(1.750) @db.Decimal(5, 3)
  socsoWageCeiling  Decimal @default(6000.00) @db.Decimal(14, 2)
  socsoBandWidth    Decimal @default(100.00) @db.Decimal(14, 2)

  // EIS — same generation mechanism
  eisEmployeeRate Decimal @default(0.200) @db.Decimal(5, 3)
  eisEmployerRate Decimal @default(0.200) @db.Decimal(5, 3)
  eisWageCeiling  Decimal @default(6000.00) @db.Decimal(14, 2)
  eisBandWidth    Decimal @default(100.00) @db.Decimal(14, 2)

  // HRDF — an employer-only levy on gross
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

  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 6: Generate and apply the migration**

```bash
npx prisma migrate dev --name add_staff_payroll
```

- [ ] **Step 7: Inspect the generated SQL for the enum-in-transaction problem**

```bash
cat prisma/migrations/*_add_staff_payroll/migration.sql | head -40
```

`ALTER TYPE "UserRole" ADD VALUE 'STAFF'` cannot run inside a transaction on PostgreSQL versions before 12, and Prisma may emit a warning about it. If the migration applied cleanly against the local database, nothing needs doing. If it failed with `ALTER TYPE ... cannot run inside a transaction block`, split the enum change into its own earlier migration directory containing only that one statement.

- [ ] **Step 8: Verify the client regenerated and the project still typechecks**

```bash
npx prisma generate
npx tsc --noEmit
```

Expected: no errors. Nothing existing referenced the new models, and `UserRole` gaining a value is source-compatible because `src/lib/session.ts` types the role as a string union — which Task 8 widens.

- [ ] **Step 9: Confirm no existing vendor query changed behaviour**

```bash
npm run lint
grep -rn "prisma.vendor\." src/ | wc -l
```

The count is informational: `Employee` is a separate model precisely so none of these queries need a filter added. If any vendor list starts showing employees, the schema is wrong.

- [ ] **Step 10: Commit**

```bash
git add prisma/
git commit -m "$(cat <<'MSG'
feat(payroll): add employee, payroll run and payslip schema

Additive only: new models and enums, one UserRole value, one optional relation
on User. No backfill, no dropped columns, and nothing touching Vendor, Bill or
InvoiceSubmission, so existing vendor queries cannot regress.

Employee is a separate model rather than a fourth vendor AccountType: Vendor
carries ~50 columns meaningless for staff, a PENDING/APPROVED lifecycle that
does not describe employment, and relations to bills and invoices. Folding
staff in would leak them into every existing prisma.vendor query.

Payslip duplicates employee facts and stores every computed figure as a column
so a finalized payslip is immune to later profile or rate changes.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 7: Seed the statutory band tables

The band values must come from the same code the engine uses, not from hand-typed numbers. This task generates the SQL with a throwaway script so the seeded table and `generateBands` cannot disagree.

**Files:**
- Create: `scripts/generate-band-sql.ts` (kept — useful when PERKESO revises rates)
- Create: `prisma/migrations/<timestamp>_seed_statutory_bands/migration.sql`

**Interfaces:**
- Consumes: `generateBands` from `@/lib/payroll/bands`
- Produces: 120 `StatutoryBand` rows (60 SOCSO, 60 EIS), all `source = 'GENERATED'`, and a `PayrollSettings` singleton row

- [ ] **Step 1: Write the SQL generator script**

Create `scripts/generate-band-sql.ts`:

```ts
/**
 * Prints the INSERT statements that seed the SOCSO and EIS band tables.
 *
 * Run this rather than hand-typing figures: it calls the same generateBands
 * the calculation engine calls, so the seeded rows and the engine cannot
 * disagree. Re-run it and create a new migration whenever PERKESO revises the
 * rates or the wage ceiling.
 *
 *   npx tsx scripts/generate-band-sql.ts > /tmp/bands.sql
 */
import { generateBands } from "../src/lib/payroll/bands";

const SOCSO = { employeeRate: 0.5, employerRate: 1.75, wageCeiling: 6000, bandWidth: 100 };
const EIS = { employeeRate: 0.2, employerRate: 0.2, wageCeiling: 6000, bandWidth: 100 };

function emit(type: "SOCSO" | "EIS", params: typeof SOCSO) {
  const rows = generateBands(params).map(
    (band) =>
      `  ('${type.toLowerCase()}_${band.wageFrom}', '${type}', ${band.wageFrom.toFixed(2)}, ` +
      `${band.wageTo.toFixed(2)}, ${band.employeeAmount.toFixed(2)}, ` +
      `${band.employerAmount.toFixed(2)}, 'GENERATED')`
  );

  console.log(
    `-- ${type}: ${rows.length} bands, ${params.bandWidth} wide, ceiling ${params.wageCeiling}\n` +
      `-- Generated from ${params.employeeRate}% employee / ${params.employerRate}% employer\n` +
      `-- by scripts/generate-band-sql.ts. Rule: band midpoint x rate, floored to 5 sen.\n` +
      `INSERT INTO "StatutoryBand" ("id", "type", "wageFrom", "wageTo", "employeeAmount", "employerAmount", "source") VALUES\n` +
      rows.join(",\n") +
      ";\n"
  );
}

emit("SOCSO", SOCSO);
emit("EIS", EIS);
```

- [ ] **Step 2: Create an empty migration**

```bash
npx prisma migrate dev --create-only --name seed_statutory_bands
```

- [ ] **Step 3: Generate the band SQL and check the reference band**

```bash
npx tsx scripts/generate-band-sql.ts > /tmp/bands.sql
grep "socso_5200" /tmp/bands.sql
```

Expected line: `('socso_5200', 'SOCSO', 5200.00, 5300.00, 26.25, 91.85, 'GENERATED')`

**If those two amounts are not 26.25 and 91.85, stop.** They are the reference payslip's figures and the whole engine is calibrated to them.

```bash
grep "eis_5200" /tmp/bands.sql
```

Expected: `('eis_5200', 'EIS', 5200.00, 5300.00, 10.50, 10.50, 'GENERATED')`

- [ ] **Step 4: Assemble the migration file**

Write the header, then append the generated SQL:

```bash
MIG=$(ls -d prisma/migrations/*_seed_statutory_bands)
cat > "$MIG/migration.sql" <<'HEADER'
-- Seeds the SOCSO and EIS contribution tables and the PayrollSettings singleton.
--
-- These are reference data the application cannot function without, so they are
-- seeded by a migration rather than by prisma/seed.ts — production gets them
-- without anyone remembering a setup step.
--
-- IMPORTANT: these rows are GENERATED from the statutory rates using the rule
-- "band midpoint x rate, floored to 5 sen", which was inferred from a single
-- reference payslip. They are a starting point, not an authority. An admin must
-- reconcile them against the official PERKESO schedule and stamp
-- PayrollSettings.bandsVerifiedAt before real payroll is run; until then the
-- payroll pages display a warning. See spec section 12.
--
-- Regenerate with: npx tsx scripts/generate-band-sql.ts

-- The singleton row, so getPayrollSettings() never has to create it under load.
INSERT INTO "PayrollSettings" ("id", "bandsGeneratedAt", "updatedAt")
VALUES ('singleton', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

HEADER
cat /tmp/bands.sql >> "$MIG/migration.sql"
```

- [ ] **Step 5: Apply the migration**

```bash
npx prisma migrate dev
```

- [ ] **Step 6: Verify the seeded data**

```bash
npx prisma studio --browser none &
```

Or query directly — confirm 60 rows per type and that the reference band is right:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const socso = await p.statutoryBand.count({ where: { type: 'SOCSO' } });
const eis = await p.statutoryBand.count({ where: { type: 'EIS' } });
const band = await p.statutoryBand.findFirst({ where: { type: 'SOCSO', wageFrom: 5200 } });
console.log({ socso, eis, employee: String(band?.employeeAmount), employer: String(band?.employerAmount) });
await p.\$disconnect();
"
```

Expected: `{ socso: 60, eis: 60, employee: '26.25', employer: '91.85' }`

- [ ] **Step 7: Commit**

```bash
git add scripts/ prisma/
git commit -m "$(cat <<'MSG'
feat(payroll): seed SOCSO and EIS band tables

Seeded by migration rather than prisma/seed.ts: these are reference data the
app cannot function without, and production should not depend on anyone
remembering a setup step.

The SQL is generated by scripts/generate-band-sql.ts, which calls the same
generateBands the engine calls, so the seeded rows and the calculation cannot
disagree. Re-run it when PERKESO revises the rates.

Rows land as source=GENERATED and bandsVerifiedAt stays null, so the payroll
pages warn until an admin reconciles them against the official schedule.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
## Task 8: Wire up the STAFF role

Must land before any employee is created: a `STAFF` user logging in today would be redirected to `/vendor`, which the middleware then bounces back to `/login`.

**Files:**
- Modify: `src/lib/session.ts`
- Modify: `src/lib/currentUser.ts`
- Modify: `src/middleware.ts`
- Modify: `src/actions/auth.ts:116`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `Employee` model from Task 6
- Produces:
  - `SessionPayload` gains `employeeId: string | null` and `role` widens to `"ADMIN" | "VENDOR" | "STAFF"`
  - `requireStaff(): Promise<Employee>` from `@/lib/currentUser`

- [ ] **Step 1: Widen the session payload**

In `src/lib/session.ts`, change the type and the `getSession` return:

```ts
export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "VENDOR" | "STAFF";
  vendorId: string | null;
  employeeId: string | null;
};
```

And in `getSession`, add `employeeId` alongside `vendorId`:

```ts
    return {
      userId: payload.userId as string,
      role: payload.role as "ADMIN" | "VENDOR" | "STAFF",
      vendorId: (payload.vendorId as string | null) ?? null,
      employeeId: (payload.employeeId as string | null) ?? null,
    };
```

Existing sessions issued before this change simply have no `employeeId` claim, and the `?? null` handles that — nobody is logged out.

- [ ] **Step 2: Add `requireStaff` to `src/lib/currentUser.ts`**

```ts
export async function requireStaff() {
  const session = await getSession();
  if (!session || session.role !== "STAFF" || !session.employeeId) {
    redirect("/login");
  }
  const employee = await prisma.employee.findUnique({ where: { id: session.employeeId } });
  if (!employee) {
    redirect("/login");
  }
  return employee;
}
```

- [ ] **Step 3: Add the `/staff` branch to `src/middleware.ts`**

After the existing `/vendor` block, add:

```ts
  if (pathname.startsWith("/staff")) {
    const role = await getRole(request);
    if (role !== "STAFF") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
```

And widen the matcher and the `getRole` return type:

```ts
export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/staff/:path*"],
};
```

```ts
async function getRole(request: NextRequest): Promise<"ADMIN" | "VENDOR" | "STAFF" | null> {
```

```ts
    return payload.role as "ADMIN" | "VENDOR" | "STAFF";
```

- [ ] **Step 4: Make the login redirect three-way**

In `src/actions/auth.ts`, the `loginUser` query currently includes only `vendor`. Change it to include `employee`, then fix the session and redirect:

```ts
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { vendor: true, employee: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    role: user.role,
    vendorId: user.vendor?.id ?? null,
    employeeId: user.employee?.id ?? null,
  });

  redirect(user.role === "ADMIN" ? "/admin" : user.role === "STAFF" ? "/staff" : "/vendor");
```

- [ ] **Step 5: Fix the other `createSession` call**

`registerVendor` in the same file also calls `createSession`. Add `employeeId: null`:

```ts
  await createSession({ userId: vendor.userId, role: "VENDOR", vendorId: vendor.id, employeeId: null });
```

- [ ] **Step 6: Add the admin nav items**

In `src/app/admin/layout.tsx`, extend the `links` array. Insert after the `All Invoices` entry, keeping `Profile` last:

```tsx
    { href: "/admin/staff", label: "Staff", icon: <IconUsers className="shrink-0" /> },
    { href: "/admin/payroll", label: "Payroll", icon: <IconCard className="shrink-0" /> },
    { href: "/admin/payroll-settings", label: "Payroll Settings", icon: <IconSettings className="shrink-0" /> },
```

Import `IconCard` alongside the existing icon imports. `IconUsers` and `IconSettings` are already imported and now appear twice in the sidebar (`All Vendors`/`Staff` and `Billing Settings`/`Payroll Settings`). That duplication is cosmetic and left alone — the sidebar reaching eight items is noted in `docs/payroll-future-plans.md` as a grouping job for later.

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors. `tsc` catching a missing `employeeId` at another `createSession` call site is the point of adding it as a required field rather than an optional one.

- [ ] **Step 8: Manually verify nothing regressed for existing users**

Start the dev server and confirm an admin and a vendor can still both log in and land in the right place:

```bash
npm run dev
```

- Sign in as the seeded admin → lands on `/admin`, sidebar shows the three new items, each currently 404s (their pages arrive in Phases 5-7).
- Sign in as an existing vendor → lands on `/vendor`, nothing changed.

- [ ] **Step 9: Commit**

```bash
git add src/lib/session.ts src/lib/currentUser.ts src/middleware.ts src/actions/auth.ts src/app/admin/layout.tsx
git commit -m "$(cat <<'MSG'
feat(payroll): add the STAFF role and route guards

Lands before any employee exists: a STAFF user logging in without this would
be redirected to /vendor and bounced straight back to /login by middleware.

employeeId is a required field on SessionPayload rather than optional, so the
compiler finds every createSession call site. Sessions issued before this
change have no employeeId claim and are handled by the ?? null fallback, so
nobody is logged out.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

# Phase 3 — Drafting a payroll run

Task order note: finalizing a run renders PDFs, so the PDF renderer (Phase 4)
lands before finalize (Phase 5) rather than alongside the rest of `run.ts`.

## Task 9: Settings accessor and rate config loader

**Files:**
- Create: `src/lib/payrollSettings.ts`
- Create: `src/lib/payroll/rates.ts`

**Interfaces:**
- Consumes: `prisma`; types `Band`, `RateConfig` from `./types`
- Produces:
  - `getPayrollSettings(): Promise<PayrollSettings>` from `@/lib/payrollSettings`
  - `loadRateConfig(): Promise<RateConfig>` from `@/lib/payroll/rates`
  - `bandsFor(type: "SOCSO" | "EIS", rows: StatutoryBand[]): Band[]` from `@/lib/payroll/rates`

- [ ] **Step 1: Create `src/lib/payrollSettings.ts`**

Mirrors `src/lib/orgSettings.ts` exactly — read that file first.

```ts
import "server-only";
import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";

/**
 * The seed migration inserts this row, so the create branch is a safety net for
 * a database seeded before that migration rather than the normal path.
 */
export async function getPayrollSettings() {
  const existing = await prisma.payrollSettings.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return existing;
  return prisma.payrollSettings.create({ data: { id: SINGLETON_ID } });
}
```

- [ ] **Step 2: Create `src/lib/payroll/rates.ts`**

```ts
import "server-only";
import type { StatutoryBand } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPayrollSettings } from "@/lib/payrollSettings";
import type { Band, RateConfig } from "./types";

/**
 * Converts stored band rows into the plain shape the pure engine takes.
 * Prisma Decimal values are objects, so every field is coerced with Number().
 */
export function bandsFor(type: "SOCSO" | "EIS", rows: StatutoryBand[]): Band[] {
  return rows
    .filter((row) => row.type === type)
    .map((row) => ({
      wageFrom: Number(row.wageFrom),
      wageTo: Number(row.wageTo),
      employeeAmount: Number(row.employeeAmount),
      employerAmount: Number(row.employerAmount),
    }));
}

/**
 * Assembles the RateConfig the calculation engine needs from the settings
 * singleton and the band tables.
 *
 * This is the only bridge between persistence and the pure engine — calc.ts
 * never touches Prisma, which is what makes it unit-testable.
 */
export async function loadRateConfig(): Promise<RateConfig> {
  const [settings, bands] = await Promise.all([
    getPayrollSettings(),
    prisma.statutoryBand.findMany({ orderBy: { wageFrom: "asc" } }),
  ]);

  return {
    epfEmployeeRate: Number(settings.epfEmployeeRate),
    epfEmployerRate: Number(settings.epfEmployerRate),
    epfEmployerRateBelowThreshold: Number(settings.epfEmployerRateBelowThreshold),
    epfEmployerThreshold: Number(settings.epfEmployerThreshold),
    hrdfEnabled: settings.hrdfEnabled,
    hrdfRate: Number(settings.hrdfRate),
    socsoBands: bandsFor("SOCSO", bands),
    eisBands: bandsFor("EIS", bands),
  };
}
```

- [ ] **Step 3: Verify the loader reproduces the reference figures end to end**

This is the first check that the seeded database and the engine agree:

```bash
npx tsx -e "
import { loadRateConfig } from './src/lib/payroll/rates';
import { computePayslip } from './src/lib/payroll/calc';

const config = await loadRateConfig();
const result = computePayslip({
  lines: [{ kind: 'EARNING', amount: 5300, taxable: true, epfApplicable: true, socsoApplicable: true }],
  employee: {
    epfEnabled: true, socsoEnabled: true, eisEnabled: true,
    epfEmployeeRateOverride: null, epfEmployerRateOverride: null,
    monthlyZakat: 0, pcb: 130.5,
  },
  config,
});
console.log(result);
console.log(result.netPay === 4549.75 ? 'REFERENCE MATCHES' : 'MISMATCH');
"
```

Expected: the figures from the golden fixture, then `REFERENCE MATCHES`. A mismatch here means the seeded bands and the engine disagree — stop and diff them rather than proceeding.

- [ ] **Step 4: Typecheck and commit**

```bash
npx tsc --noEmit
git add src/lib/payrollSettings.ts src/lib/payroll/rates.ts
git commit -m "$(cat <<'MSG'
feat(payroll): load rate config from settings and band tables

The only bridge between persistence and the pure engine. calc.ts never touches
Prisma, which is what keeps it unit-testable; this module does the Decimal
coercion and hands over plain numbers.

Verified end to end: the seeded bands plus these settings reproduce the
reference payslip's net pay of 4549.75.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
## Task 10: Draft a payroll run

**Files:**
- Create: `src/lib/payroll/run.ts`

**Interfaces:**
- Consumes: `computePayslip` from `./calc`; `prorateSalaryForMonth` from `./proration`; `formatPayslipNumber` from `./payslipNumber`; `loadRateConfig` from `./rates`; types from `./types`
- Produces:
  - `generatePayrollRun(year: number, month: number): Promise<{ runId: string; drafted: number }>`
  - `payslipMoneyFields(computed: PayslipCalcOutput)` — maps engine output to Prisma `Payslip` scalars
  - `toCalcLines(lines: { kind: PayslipLineKind; amount: Prisma.Decimal | number; taxable: boolean; epfApplicable: boolean; socsoApplicable: boolean }[]): LineInput[]`
  - `recomputePayslip(payslipId: string): Promise<void>` — used by Task 16 after a line edit
  - const `AUTO_SALARY_LABEL = "Salary"`

- [ ] **Step 1: Create `src/lib/payroll/run.ts`**

```ts
import "server-only";
import type { Employee, PayslipLineKind, Prisma, SalaryRecord } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computePayslip } from "./calc";
import { formatPayslipNumber } from "./payslipNumber";
import { prorateSalaryForMonth } from "./proration";
import { loadRateConfig } from "./rates";
import type { LineInput, PayslipCalcOutput, RateConfig } from "./types";

/** The label on the salary line the generator creates. */
export const AUTO_SALARY_LABEL = "Salary";

/** Maps engine output onto the Payslip scalar columns. */
export function payslipMoneyFields(computed: PayslipCalcOutput) {
  return {
    grossPay: computed.grossPay,
    taxablePay: computed.taxablePay,
    epfBase: computed.epfBase,
    socsoBase: computed.socsoBase,
    epfEmployee: computed.epfEmployee,
    epfEmployer: computed.epfEmployer,
    socsoEmployee: computed.socsoEmployee,
    socsoEmployer: computed.socsoEmployer,
    eisEmployee: computed.eisEmployee,
    eisEmployer: computed.eisEmployer,
    zakat: computed.zakat,
    hrdfEmployer: computed.hrdfEmployer,
    totalEmployeeDeductions: computed.totalEmployeeDeductions,
    totalEmployerCost: computed.totalEmployerCost,
    netPay: computed.netPay,
  };
}

/** Strips stored lines down to what the pure engine needs, coercing Decimals. */
export function toCalcLines(
  lines: {
    kind: PayslipLineKind;
    amount: Prisma.Decimal | number;
    taxable: boolean;
    epfApplicable: boolean;
    socsoApplicable: boolean;
  }[]
): LineInput[] {
  return lines.map((line) => ({
    kind: line.kind,
    amount: Number(line.amount),
    taxable: line.taxable,
    epfApplicable: line.epfApplicable,
    socsoApplicable: line.socsoApplicable,
  }));
}

/** The statutory facts the engine needs about an employee. */
function calcFacts(employee: Employee, pcb: number) {
  return {
    epfEnabled: employee.epfEnabled,
    socsoEnabled: employee.socsoEnabled,
    eisEnabled: employee.eisEnabled,
    epfEmployeeRateOverride:
      employee.epfEmployeeRateOverride === null ? null : Number(employee.epfEmployeeRateOverride),
    epfEmployerRateOverride:
      employee.epfEmployerRateOverride === null ? null : Number(employee.epfEmployerRateOverride),
    monthlyZakat: employee.monthlyZakat === null ? 0 : Number(employee.monthlyZakat),
    pcb,
  };
}

/** The employee facts copied onto the payslip so it survives later profile edits. */
function snapshotEmployeeFacts(employee: Employee) {
  return {
    employeeName: employee.fullName,
    designation: employee.designation,
    department: employee.department,
    nationality: employee.nationality,
    gender: employee.gender,
    nricOrPassport: employee.nricOrPassport,
    epfNumber: employee.epfNumber,
    socsoNumber: employee.socsoNumber,
    pcbNumber: employee.pcbNumber,
  };
}

/**
 * Everyone employed on ANY day of the month, so mid-month joiners and leavers
 * are included and prorated. Employment status is irrelevant here — the dates
 * decide. Someone terminated last year is excluded by the endedOn bound.
 */
async function employeesForMonth(year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  return prisma.employee.findMany({
    where: {
      hiredOn: { lte: monthEnd },
      OR: [{ endedOn: null }, { endedOn: { gte: monthStart } }],
    },
    include: { salaryRecords: true },
    orderBy: { employeeCode: "asc" },
  });
}

/**
 * Creates or refreshes one draft payslip.
 *
 * Refresh semantics matter: re-generating a draft run rebuilds only the
 * auto-generated salary line and leaves every hand-added allowance, arrears or
 * loan line in place, along with whatever PCB the admin has already entered.
 * Wiping those would make re-generating a destructive act.
 */
async function draftPayslip(params: {
  runId: string;
  employee: Employee & { salaryRecords: SalaryRecord[] };
  config: RateConfig;
  year: number;
  month: number;
}) {
  const { runId, employee, config, year, month } = params;

  const prorated = prorateSalaryForMonth({
    year,
    month,
    salaryRecords: employee.salaryRecords.map((record) => ({
      monthlySalary: Number(record.monthlySalary),
      effectiveFrom: record.effectiveFrom,
    })),
    hiredOn: employee.hiredOn,
    endedOn: employee.endedOn,
  });

  const existing = await prisma.payslip.findUnique({
    where: { runId_employeeId: { runId, employeeId: employee.id } },
    include: { lines: true },
  });

  const manualLines = existing?.lines.filter((line) => !line.autoGenerated) ?? [];
  const pcb = existing?.pcb === null || existing === null ? 0 : Number(existing.pcb);

  const isPartialMonth = prorated.proratedDays < prorated.daysInMonth;
  const salaryLine = {
    kind: "EARNING" as const,
    label: AUTO_SALARY_LABEL,
    // Units are shown only for a partial month, where "16 / 31 days" is the
    // explanation the employee needs. A full month has no interesting units.
    units: isPartialMonth ? prorated.proratedDays : null,
    rate: null,
    amount: prorated.amount,
    taxable: true,
    epfApplicable: true,
    socsoApplicable: true,
    autoGenerated: true,
    sortOrder: 0,
  };

  const computed = computePayslip({
    lines: toCalcLines([salaryLine, ...manualLines]),
    employee: calcFacts(employee, pcb),
    config,
  });

  const shared = {
    ...snapshotEmployeeFacts(employee),
    ...payslipMoneyFields(computed),
    proratedDays: prorated.proratedDays,
    daysInMonth: prorated.daysInMonth,
  };

  if (existing) {
    await prisma.$transaction([
      prisma.payslipLine.deleteMany({ where: { payslipId: existing.id, autoGenerated: true } }),
      prisma.payslip.update({
        where: { id: existing.id },
        data: { ...shared, lines: { create: [salaryLine] } },
      }),
    ]);
    return;
  }

  await prisma.payslip.create({
    data: {
      runId,
      employeeId: employee.id,
      payslipNumber: formatPayslipNumber(year, month, employee.employeeCode),
      pcb: null,
      ...shared,
      lines: { create: [salaryLine] },
    },
  });
}

/**
 * Drafts (or refreshes) the payroll run for a month.
 *
 * Idempotent: the unique constraint on (year, month) means a month can only
 * ever have one run, and re-running against a DRAFT refreshes it. A FINALIZED
 * run is refused outright — that is the whole point of finalizing.
 */
export async function generatePayrollRun(year: number, month: number) {
  const existing = await prisma.payrollRun.findUnique({ where: { year_month: { year, month } } });

  if (existing?.status === "FINALIZED") {
    throw new Error("This payroll run has been finalized and cannot be regenerated.");
  }

  const run = existing ?? (await prisma.payrollRun.create({ data: { year, month } }));
  const config = await loadRateConfig();
  const employees = await employeesForMonth(year, month);

  for (const employee of employees) {
    await draftPayslip({ runId: run.id, employee, config, year, month });
  }

  return { runId: run.id, drafted: employees.length };
}

/**
 * Recomputes one draft payslip from its current lines and PCB. Called after an
 * admin edits lines or enters PCB, so the stored figures never lag the lines.
 */
export async function recomputePayslip(payslipId: string): Promise<void> {
  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    include: { lines: true, employee: true, run: true },
  });

  if (payslip.run.status === "FINALIZED") {
    throw new Error("This payslip belongs to a finalized run and cannot be recomputed.");
  }

  const config = await loadRateConfig();
  const computed = computePayslip({
    lines: toCalcLines(payslip.lines),
    employee: calcFacts(payslip.employee, payslip.pcb === null ? 0 : Number(payslip.pcb)),
    config,
  });

  await prisma.payslip.update({
    where: { id: payslipId },
    data: payslipMoneyFields(computed),
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. If Prisma complains about `year_month`, check the generated client — the compound unique input is named after the `@@unique([year, month])` fields.

- [ ] **Step 3: Smoke-test against a real employee**

Create one employee by hand, draft a run, and confirm the figures. This is the first end-to-end proof that persistence and the engine agree.

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { generatePayrollRun } from './src/lib/payroll/run';
import { hashPassword } from './src/lib/auth';

const p = new PrismaClient();
const user = await p.user.create({
  data: { email: 'smoke.staff@example.com', passwordHash: await hashPassword('Smoke123!'), role: 'STAFF' },
});
const employee = await p.employee.create({
  data: {
    userId: user.id, employeeCode: 'G6-EMP-999', fullName: 'Smoke Test',
    designation: 'Software Developer', nricOrPassport: '951105-08-6183',
    epfNumber: '23173554', socsoNumber: '951105086183',
    email: 'smoke.staff@example.com', phone: '0123456789',
    bankName: 'Maybank', accountNumber: '1234567890',
    hiredOn: new Date(Date.UTC(2020, 0, 1)),
    salaryRecords: { create: [{ monthlySalary: 5300, effectiveFrom: new Date(Date.UTC(2020, 0, 1)) }] },
  },
});

const { runId, drafted } = await generatePayrollRun(2024, 11);
const payslip = await p.payslip.findFirstOrThrow({ where: { runId, employeeId: employee.id }, include: { lines: true } });
console.log({ drafted, number: payslip.payslipNumber, lines: payslip.lines.length });
console.log({
  gross: String(payslip.grossPay), epfEmp: String(payslip.epfEmployee), epfEmr: String(payslip.epfEmployer),
  socsoEmp: String(payslip.socsoEmployee), socsoEmr: String(payslip.socsoEmployer),
  eis: String(payslip.eisEmployee), pcb: payslip.pcb === null ? 'NULL (not entered)' : String(payslip.pcb),
  net: String(payslip.netPay),
});
await p.\$disconnect();
"
```

Expected: `payslipNumber` is `PS-2024-11-G6-EMP-999`, one line, gross `5300`, EPF `583` / `636`, SOCSO `26.25` / `91.85`, EIS `10.5`, `pcb` is `NULL (not entered)`, and net is `4549.75 + 130.50 = 4680.25` — higher than the reference precisely because PCB has not been entered yet. Entering PCB is Task 17.

- [ ] **Step 4: Verify the refresh preserves manual work**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { generatePayrollRun, recomputePayslip } from './src/lib/payroll/run';

const p = new PrismaClient();
const payslip = await p.payslip.findFirstOrThrow({ where: { payslipNumber: 'PS-2024-11-G6-EMP-999' } });

await p.payslipLine.create({
  data: {
    payslipId: payslip.id, kind: 'EARNING', label: 'Travel allowance', amount: 500,
    taxable: true, epfApplicable: false, socsoApplicable: true, autoGenerated: false, sortOrder: 1,
  },
});
await p.payslip.update({ where: { id: payslip.id }, data: { pcb: 130.5 } });
await recomputePayslip(payslip.id);

await generatePayrollRun(2024, 11);

const after = await p.payslip.findUniqueOrThrow({ where: { id: payslip.id }, include: { lines: true } });
console.log({
  lines: after.lines.map((l) => l.label).sort(),
  pcb: String(after.pcb),
  gross: String(after.grossPay),
  epfBase: String(after.epfBase),
});
await p.\$disconnect();
"
```

Expected: `lines` is `['Salary', 'Travel allowance']`, `pcb` is still `130.5`, gross is `5800`, and `epfBase` is `5300` — the allowance is not EPF-able. A refresh that dropped the allowance or reset PCB is a bug in `draftPayslip`.

- [ ] **Step 5: Clean up the smoke-test data**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
await p.payrollRun.deleteMany({ where: { year: 2024, month: 11 } });
await p.user.deleteMany({ where: { email: 'smoke.staff@example.com' } });
await p.\$disconnect();
"
```

Deleting the run cascades to its payslips and lines; deleting the user cascades to the employee and its salary records.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payroll/run.ts
git commit -m "$(cat <<'MSG'
feat(payroll): draft monthly payroll runs

Drafts one payslip per employee employed on any day of the month, so mid-month
joiners and leavers are included and prorated. The unique constraint on
(year, month) makes a month single-run; re-running refreshes a draft and is
refused outright on a finalized run.

Refresh rebuilds only the auto-generated salary line. Hand-added allowance,
arrears and loan lines survive, as does whatever PCB the admin has entered --
otherwise re-generating would be a destructive act.

PCB starts NULL rather than zero so finalize can tell "not entered yet" from
"confirmed zero".

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Phase 4 — The payslip PDF

## Task 11: Payslip PDF data type and template

**Files:**
- Modify: `src/lib/pdf/types.ts` (append; do not touch `InvoicePdfData`)
- Create: `src/lib/pdf/templates/PayslipClassic.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (the type is pure, the template is presentational)
- Produces: types `PayslipPdfData`, `PayslipAmountRow`, `PayslipContributionRow`; component `PayslipClassic({ data }: { data: PayslipPdfData })`

The template is presentational only. It receives pre-formatted strings — it never computes, rounds, or formats a number. All arithmetic happened in `calc.ts`; all formatting happens in Task 12's `buildPayslipPdfData`.

- [ ] **Step 1: Append the types to `src/lib/pdf/types.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/lib/pdf/templates/PayslipClassic.tsx`**

Read `src/lib/pdf/templates/ClassicInvoice.tsx` first for the house react-pdf idioms — `StyleSheet.create`, `fontFamily: "Helvetica"`, borders as `"0.5 solid #e4e4e7"` strings, `fixed` on absolutely-positioned footers.

```tsx
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PayslipContributionRow, PayslipPdfData } from "../types";

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 64, paddingHorizontal: 44, fontSize: 9, fontFamily: "Helvetica", color: "#18181b" },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 54, height: 54, objectFit: "contain", marginBottom: 8 },
  employerName: { fontSize: 14, fontWeight: 700 },
  employerLine: { fontSize: 8, color: "#52525b", marginTop: 2 },
  headerRight: { textAlign: "right" },
  periodLabel: { fontSize: 10, fontWeight: 700 },
  issuedLabel: { fontSize: 8, color: "#52525b", marginTop: 2 },

  rule: { borderTop: "0.5 solid #d4d4d8", marginTop: 16, marginBottom: 16 },
  ruleDashed: { borderTop: "0.5 dashed #d4d4d8", marginTop: 14, marginBottom: 14 },

  employeeName: { fontSize: 12, fontWeight: 700 },
  designation: { fontSize: 9, color: "#71717a", marginTop: 2 },

  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  gridCell: { width: "25%", marginBottom: 10 },
  gridLabel: { fontSize: 7, color: "#71717a", marginBottom: 2 },
  gridValue: { fontSize: 9 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sectionTitle: { fontSize: 11, fontWeight: 700 },
  colHeaders: { flexDirection: "row" },
  colHeader: { fontSize: 7, color: "#71717a", textAlign: "right" },

  amountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  amountLabel: { flex: 1, fontSize: 9 },
  colUnits: { width: 60, fontSize: 9, textAlign: "right" },
  colRate: { width: 60, fontSize: 9, textAlign: "right" },
  colAmount: { width: 80, fontSize: 9, textAlign: "right" },

  pillRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  pill: { backgroundColor: "#f4f4f5", borderRadius: 18, paddingVertical: 8, paddingHorizontal: 22, alignItems: "center", minWidth: 110 },
  pillLabel: { fontSize: 7, fontWeight: 700, color: "#52525b" },
  pillValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },

  contribHeaderRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 4 },
  contribLabelCell: { flex: 1 },
  contribCell: { width: 52, fontSize: 9, textAlign: "right" },
  contribCellHeader: { width: 52, fontSize: 7, color: "#71717a", textAlign: "right" },
  contribTotal: { width: 80, fontSize: 9, textAlign: "right" },
  contribRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  rowLabelStrong: { flex: 1, fontSize: 9, fontWeight: 700 },
  rowLabelMuted: { flex: 1, fontSize: 8, color: "#71717a" },
  cellMuted: { width: 52, fontSize: 8, color: "#71717a", textAlign: "right" },

  taxableRow: { alignItems: "flex-end", marginTop: 10 },
  taxableLabel: { fontSize: 7, fontWeight: 700, color: "#52525b" },
  taxableValue: { fontSize: 11, fontWeight: 700, color: "#52525b", marginTop: 1 },

  footnotes: { position: "absolute", bottom: 34, left: 44, right: 44 },
  footnote: { fontSize: 6.5, color: "#52525b", marginBottom: 3 },
  footer: { position: "absolute", bottom: 18, left: 44, right: 44, textAlign: "center", fontSize: 6.5, color: "#a1a1aa" },
});

/** Column headers above a Units / Rate / Amount block. */
function AmountColumnHeaders() {
  return (
    <View style={styles.colHeaders}>
      <Text style={[styles.colHeader, { width: 60 }]}>Units</Text>
      <Text style={[styles.colHeader, { width: 60 }]}>Rate</Text>
      <Text style={[styles.colHeader, { width: 80 }]}>Amount</Text>
    </View>
  );
}

function AmountRows({ rows, negative }: { rows: PayslipPdfData["earnings"]; negative?: boolean }) {
  return (
    <>
      {rows.map((row, index) => (
        <View style={styles.amountRow} key={index}>
          <Text style={styles.amountLabel}>{row.label}</Text>
          <Text style={styles.colUnits}>{row.units ?? ""}</Text>
          <Text style={styles.colRate}>{row.rate ?? ""}</Text>
          <Text style={styles.colAmount}>
            {negative ? "-" : ""}
            {row.amount}
          </Text>
        </View>
      ))}
    </>
  );
}

function ContributionRow({
  row,
  strong,
  showZakat,
  showHrdf,
}: {
  row: PayslipContributionRow;
  strong: boolean;
  showZakat: boolean;
  showHrdf: boolean;
}) {
  const cell = strong ? styles.contribCell : styles.cellMuted;
  return (
    <View style={styles.contribRow}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabelMuted}>{row.label}</Text>
      <Text style={cell}>{row.epf}</Text>
      <Text style={cell}>{row.socso}</Text>
      <Text style={cell}>{row.eis}</Text>
      {showZakat ? <Text style={cell}>{row.zakat}</Text> : null}
      <Text style={cell}>{row.pcb}</Text>
      {showHrdf ? <Text style={cell}>{row.hrdf}</Text> : null}
      <Text style={styles.contribTotal}>{row.total ? `-${row.total}` : ""}</Text>
    </View>
  );
}

export function PayslipClassic({ data }: { data: PayslipPdfData }) {
  const contributions = data.showEmployerContributions
    ? data.contributions
    : data.contributions.filter((row) => row.label === "Employee");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {data.logoDataUri ? <Image src={data.logoDataUri} style={styles.logo} /> : null}
            <Text style={[styles.employerName, { color: data.accentColor }]}>{data.employerName}</Text>
            {data.employerAddressLines.map((line, index) => (
              <Text style={styles.employerLine} key={index}>
                {line}
              </Text>
            ))}
            {data.businessRegNumber ? (
              <Text style={styles.employerLine}>Business registration number: {data.businessRegNumber}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.periodLabel}>{data.periodLabel}</Text>
            <Text style={styles.issuedLabel}>{data.issuedOnLabel}</Text>
          </View>
        </View>

        <View style={styles.rule} />

        <Text style={styles.employeeName}>{data.employeeName}</Text>
        <Text style={styles.designation}>{data.designation}</Text>

        <View style={styles.grid}>
          {data.fields.map((field) => (
            <View style={styles.gridCell} key={field.label}>
              <Text style={styles.gridLabel}>{field.label}</Text>
              <Text style={styles.gridValue}>{field.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rule} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Gross Earnings</Text>
          <AmountColumnHeaders />
        </View>
        <AmountRows rows={data.earnings} />
        {data.wageDeductions.length > 0 ? <AmountRows rows={data.wageDeductions} negative /> : null}

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Gross pay</Text>
            <Text style={styles.pillValue}>{data.grossPay}</Text>
          </View>
        </View>

        <View style={{ marginTop: 22 }}>
          <View style={styles.contribHeaderRow}>
            <Text style={[styles.sectionTitle, styles.contribLabelCell]}>Contributions</Text>
            <Text style={styles.contribCellHeader}>EPF 1</Text>
            <Text style={styles.contribCellHeader}>SOCSO</Text>
            <Text style={styles.contribCellHeader}>EIS</Text>
            {data.showZakatColumn ? <Text style={styles.contribCellHeader}>Zakat</Text> : null}
            <Text style={styles.contribCellHeader}>PCB 2</Text>
            {data.showHrdfColumn ? <Text style={styles.contribCellHeader}>HRDF</Text> : null}
            <Text style={[styles.contribCellHeader, { width: 80 }]}>Amount</Text>
          </View>

          {contributions.map((row) => (
            <ContributionRow
              key={row.label}
              row={row}
              strong={row.label === "Employee"}
              showZakat={data.showZakatColumn}
              showHrdf={data.showHrdfColumn}
            />
          ))}
        </View>

        <View style={styles.ruleDashed} />

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Net Earnings</Text>
          <AmountColumnHeaders />
        </View>
        {data.netDeductions.length > 0 ? <AmountRows rows={data.netDeductions} negative /> : null}

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Net pay</Text>
            <Text style={styles.pillValue}>{data.netPay}</Text>
          </View>
        </View>

        <View style={styles.taxableRow}>
          <Text style={styles.taxableLabel}>Taxable pay</Text>
          <Text style={styles.taxableValue}>{data.taxablePay}</Text>
        </View>

        <View style={styles.footnotes} fixed>
          {data.footnotes.map((note, index) => (
            <Text style={styles.footnote} key={index}>
              {index + 1} {note}
            </Text>
          ))}
        </View>

        {data.footerText ? (
          <Text style={styles.footer} fixed>
            {data.footerText}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdf/types.ts src/lib/pdf/templates/PayslipClassic.tsx
git commit -m "$(cat <<'MSG'
feat(payroll): add the payslip PDF template

One template rather than several. A payslip is a compliance document, so layout
variety buys nothing and every extra layout is another place the contribution
matrix could render wrongly.

Presentational only: every monetary field arrives as an already-formatted
string, so the template cannot introduce a rounding difference between what is
computed and what is printed.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
## Task 12: Render a payslip and preview it

**Files:**
- Modify: `src/lib/pdf/render.tsx`
- Create: `src/lib/payroll/payslipPdf.ts`
- Create: `src/app/api/dev/payslip-preview/route.ts`

**Interfaces:**
- Consumes: `PayslipClassic`, `PayslipPdfData` from Task 11; `getPayrollSettings`; `getOrgSettings`; `readUploadedFile` from `@/lib/storage`
- Produces:
  - `renderPayslipPdf(data: PayslipPdfData): Promise<Buffer>` from `@/lib/pdf/render`
  - `buildPayslipPdfData(payslipId: string): Promise<PayslipPdfData>` from `@/lib/payroll/payslipPdf`

- [ ] **Step 1: Add the renderer to `src/lib/pdf/render.tsx`**

Append, alongside the existing `renderInvoicePdf` and `renderReceiptPdf`:

```tsx
import { PayslipClassic } from "./templates/PayslipClassic";
import type { InvoicePdfData, PayslipPdfData } from "./types";

export async function renderPayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  return renderToBuffer(<PayslipClassic data={data} />);
}
```

Merge the `PayslipPdfData` import into the existing `./types` import rather than adding a second import line.

- [ ] **Step 2: Create `src/lib/payroll/payslipPdf.ts`**

```ts
import "server-only";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getOrgSettings } from "@/lib/orgSettings";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { readUploadedFile } from "@/lib/storage";
import type { PayslipAmountRow, PayslipPdfData } from "@/lib/pdf/types";

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

const fmt = (value: unknown) => money.format(Number(value ?? 0));

/** Mirrors logoToDataUri in src/lib/invoice.ts — react-pdf needs a data URI, not a URL. */
async function logoDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const buffer = await readUploadedFile(url);
    const ext = path.extname(url).replace(".", "").toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function amountRow(line: {
  label: string;
  units: unknown;
  rate: unknown;
  amount: unknown;
}): PayslipAmountRow {
  return {
    label: line.label,
    units: line.units === null || line.units === undefined ? null : money.format(Number(line.units)),
    rate: line.rate === null || line.rate === undefined ? null : money.format(Number(line.rate)),
    amount: fmt(line.amount),
  };
}

/**
 * Assembles everything the template prints from stored data.
 *
 * Reads figures off the Payslip columns rather than recomputing them: a
 * finalized payslip's numbers are frozen, and re-deriving them here would
 * reintroduce exactly the drift that snapshotting them prevents.
 */
export async function buildPayslipPdfData(payslipId: string): Promise<PayslipPdfData> {
  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    include: { lines: { orderBy: { sortOrder: "asc" } }, run: true, employee: true },
  });

  const [org, settings] = await Promise.all([getOrgSettings(), getPayrollSettings()]);

  const epfEmployeeRate =
    payslip.employee.epfEmployeeRateOverride ?? settings.epfEmployeeRate;
  const epfEmployerRate =
    payslip.employee.epfEmployerRateOverride ??
    (Number(payslip.epfBase) <= Number(settings.epfEmployerThreshold)
      ? settings.epfEmployerRateBelowThreshold
      : settings.epfEmployerRate);

  const pcbProfile = [
    payslip.employee.taxResident ? "Resident" : "Non-resident",
    payslip.employee.taxWorkerCategory,
    payslip.employee.taxMaritalStatus,
    payslip.employee.taxDependents === 0
      ? "No Dependent Children"
      : `${payslip.employee.taxDependents} Dependent Children`,
  ]
    .filter(Boolean)
    .join(", ");

  const periodStart = new Date(Date.UTC(payslip.run.year, payslip.run.month - 1, 1));

  return {
    employerName: org.companyName,
    employerAddressLines: (org.address ?? "").split("\n").map((line) => line.trim()).filter(Boolean),
    businessRegNumber: settings.businessRegNumber,

    periodLabel: `Payslip for ${monthYear.format(periodStart)}`,
    issuedOnLabel: `Issued on: ${fullDate.format(payslip.run.issuedOn ?? payslip.createdAt)}`,

    employeeName: payslip.employeeName,
    designation: payslip.designation,
    // Field order matches the reference payslip's grid, read left to right.
    fields: [
      { label: "Department", value: payslip.department ?? "-" },
      { label: "Nationality", value: payslip.nationality ?? "-" },
      { label: "NRIC/Passport", value: payslip.nricOrPassport },
      { label: "EPF No", value: payslip.epfNumber ?? "-" },
      { label: "Employee ID", value: payslip.employee.employeeCode },
      { label: "Gender", value: payslip.gender ?? "-" },
      { label: "PCB No", value: payslip.pcbNumber ?? "-" },
      { label: "SOCSO No", value: payslip.socsoNumber ?? "-" },
    ],

    earnings: payslip.lines.filter((line) => line.kind === "EARNING").map(amountRow),
    wageDeductions: payslip.lines.filter((line) => line.kind === "WAGE_DEDUCTION").map(amountRow),
    grossPay: fmt(payslip.grossPay),

    contributions: [
      {
        label: "Employee",
        epf: fmt(payslip.epfEmployee),
        socso: fmt(payslip.socsoEmployee),
        eis: fmt(payslip.eisEmployee),
        zakat: fmt(payslip.zakat),
        pcb: fmt(payslip.pcb),
        hrdf: fmt(0),
        total: fmt(payslip.totalEmployeeDeductions),
      },
      {
        label: "Employer",
        epf: fmt(payslip.epfEmployer),
        socso: fmt(payslip.socsoEmployer),
        eis: fmt(payslip.eisEmployer),
        zakat: fmt(0),
        pcb: fmt(0),
        hrdf: fmt(payslip.hrdfEmployer),
        total: null,
      },
    ],

    netDeductions: payslip.lines.filter((line) => line.kind === "NET_DEDUCTION").map(amountRow),
    netPay: fmt(payslip.netPay),
    taxablePay: fmt(payslip.taxablePay),

    logoDataUri: await logoDataUri(settings.payslipLogoUrl),
    accentColor: settings.accentColor,
    showEmployerContributions: settings.showEmployerContributions,
    showHrdfColumn: settings.showHrdfColumn,
    showZakatColumn: settings.showZakatColumn,
    footnotes: [
      settings.epfFootnote ??
        `EPF contributions are calculated based on ${fmt(epfEmployeeRate)}% employee rate and ${fmt(epfEmployerRate)}% employer rate`,
      `PCB Calculations are based on the following employee info: ${pcbProfile}`,
    ],
    footerText: settings.payslipFooterText,
  };
}
```

- [ ] **Step 3: Create the development preview route**

`src/app/api/dev/payslip-preview/route.ts` — admin-only and disabled in production, so it cannot become a data leak:

```ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/currentUser";
import { renderPayslipPdf } from "@/lib/pdf/render";
import { buildPayslipPdfData } from "@/lib/payroll/payslipPdf";

/**
 * Renders a payslip PDF on demand so the layout can be compared against the
 * reference document while iterating on the template. Not a product feature:
 * disabled outside development, and admin-only even there.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await requireAdmin();

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Pass ?id=<payslipId>" }, { status: 400 });

  const buffer = await renderPayslipPdf(await buildPayslipPdfData(id));
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=preview.pdf" },
  });
}
```

- [ ] **Step 4: Render a payslip and compare it against the reference**

Re-create the smoke-test employee from Task 10 step 3, set PCB to 130.50, set org settings to the reference employer, then open the preview.

```bash
npm run dev
```

Visit `http://localhost:3000/api/dev/payslip-preview?id=<payslipId>` signed in as admin.

Check against the reference image, in this order:
1. **The figures first.** Gross 5300.00, EPF 583.00 / 636.00, SOCSO 26.25 / 91.85, EIS 10.50 / 10.50, PCB 130.50, employee total -750.25, Net pay 4549.75, Taxable pay 5300.00. If any number is wrong, the bug is in the engine or `buildPayslipPdfData`, not the template — fix it before touching layout.
2. Employer block, period label, issued-on line.
3. The eight-field grid, in the reference's order.
4. Footnote 1 reads "EPF contributions are calculated based on 11.00% employee rate and 12.00% employer rate"; footnote 2 lists "Resident, Normal Worker, Single, No Dependent Children" once the employee's `taxMaritalStatus` is set to `Single`.
5. Only then adjust spacing and type sizes.

- [ ] **Step 5: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/pdf/render.tsx src/lib/payroll/payslipPdf.ts src/app/api/dev/
git commit -m "$(cat <<'MSG'
feat(payroll): render payslip PDFs and add a dev preview route

buildPayslipPdfData reads figures off the Payslip columns rather than
recomputing them. Re-deriving at render time would reintroduce exactly the
drift that snapshotting the figures prevents.

The preview route is a template-iteration tool, not a product feature: it 404s
outside development and requires an admin session even there.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

# Phase 5 — Finalizing a run

## Task 13: Validate, finalize and lock

**Files:**
- Modify: `src/lib/payroll/run.ts` (append)

**Interfaces:**
- Consumes: `loadRateConfig`; `renderPayslipPdf`; `buildPayslipPdfData`; `savePdf` from `@/lib/storage`
- Produces:
  - type `FinalizeIssue = { payslipId: string; employeeName: string; message: string }`
  - `validateRunForFinalize(runId: string): Promise<FinalizeIssue[]>`
  - `finalizePayrollRun(runId: string): Promise<{ ok: true; rendered: number; failed: number } | { ok: false; issues: FinalizeIssue[] }>`
  - `regenerateMissingPayslipPdfs(runId: string): Promise<number>`

- [ ] **Step 1: Append to `src/lib/payroll/run.ts`**

Add these imports at the top:

```ts
import { renderPayslipPdf } from "@/lib/pdf/render";
import { savePdf } from "@/lib/storage";
import { buildPayslipPdfData } from "./payslipPdf";
```

Then append:

```ts
export type FinalizeIssue = { payslipId: string; employeeName: string; message: string };

/**
 * Everything that must be true before a run can be issued.
 *
 * These guards are the reason the draft/finalize split exists. A payslip with a
 * negative net or a missing statutory number looks plausible and is wrong, and
 * once issued it cannot be quietly corrected.
 */
export async function validateRunForFinalize(runId: string): Promise<FinalizeIssue[]> {
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: runId },
    include: { payslips: { include: { employee: true } } },
  });

  if (run.status === "FINALIZED") {
    return [{ payslipId: "", employeeName: "", message: "This run has already been finalized." }];
  }

  if (run.payslips.length === 0) {
    return [{ payslipId: "", employeeName: "", message: "This run has no payslips. Generate it first." }];
  }

  const issues: FinalizeIssue[] = [];

  for (const payslip of run.payslips) {
    const add = (message: string) =>
      issues.push({ payslipId: payslip.id, employeeName: payslip.employeeName, message });

    if (payslip.pcb === null) {
      add("PCB has not been entered. Enter the LHDN figure, or 0.00 to confirm none is due.");
    }

    if (Number(payslip.netPay) < 0) {
      add(
        `Net pay is negative (${Number(payslip.netPay).toFixed(2)}). Deductions exceed pay — reduce a deduction before issuing.`
      );
    }

    if (payslip.employee.epfEnabled && !payslip.epfNumber) {
      add("EPF is enabled for this employee but no EPF number is on file.");
    }

    if (payslip.employee.socsoEnabled && !payslip.socsoNumber) {
      add("SOCSO is enabled for this employee but no SOCSO number is on file.");
    }
  }

  return issues;
}

/**
 * Locks the run, then renders the PDFs.
 *
 * The status flip and figure freeze happen in one transaction; rendering runs
 * afterwards, sequentially, following the same pattern as
 * createInvoiceSubmission in src/lib/invoice.ts. Rendering inside the
 * transaction would hold it open across N PDF renders against a 300s function
 * ceiling.
 *
 * The honest failure mode: if rendering dies partway, the run is locked with
 * some pdfPath still null. regenerateMissingPayslipPdfs covers that, and the
 * admin UI surfaces it. Locking first is the right trade — a locked run with a
 * missing PDF is recoverable, whereas an unlocked run whose PDFs have been
 * handed out is not.
 */
export async function finalizePayrollRun(runId: string) {
  const issues = await validateRunForFinalize(runId);
  if (issues.length > 0) return { ok: false as const, issues };

  const config = await loadRateConfig();
  const now = new Date();

  const run = await prisma.payrollRun.update({
    where: { id: runId },
    data: {
      status: "FINALIZED",
      finalizedAt: now,
      issuedOn: now,
      rateSnapshot: config as unknown as Prisma.InputJsonValue,
    },
    include: { payslips: { select: { id: true } } },
  });

  let rendered = 0;
  let failed = 0;

  for (const payslip of run.payslips) {
    try {
      await renderAndStorePayslipPdf(payslip.id);
      rendered++;
    } catch {
      failed++;
    }
  }

  return { ok: true as const, rendered, failed };
}

async function renderAndStorePayslipPdf(payslipId: string): Promise<void> {
  const data = await buildPayslipPdfData(payslipId);
  const buffer = await renderPayslipPdf(data);

  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    select: { payslipNumber: true, employeeId: true },
  });

  const url = await savePdf(buffer, `payslips/${payslip.employeeId}`, `${payslip.payslipNumber}.pdf`);
  await prisma.payslip.update({ where: { id: payslipId }, data: { pdfPath: url } });
}

/** Retries the payslips whose PDF never got written. Safe to run repeatedly. */
export async function regenerateMissingPayslipPdfs(runId: string): Promise<number> {
  const missing = await prisma.payslip.findMany({
    where: { runId, pdfPath: null },
    select: { id: true },
  });

  let repaired = 0;
  for (const payslip of missing) {
    try {
      await renderAndStorePayslipPdf(payslip.id);
      repaired++;
    } catch {
      // Left for the next attempt; the UI keeps showing the missing-PDF warning.
    }
  }
  return repaired;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. `Prisma` is already imported as a type in Task 10; widen it to a value import (`import { Prisma } from "@prisma/client"`) if `Prisma.InputJsonValue` errors.

- [ ] **Step 3: Verify the validation guards actually block**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { validateRunForFinalize } from './src/lib/payroll/run';
const p = new PrismaClient();
const run = await p.payrollRun.findFirstOrThrow({ where: { year: 2024, month: 11 } });
console.log('with PCB null:', await validateRunForFinalize(run.id));
await p.\$disconnect();
"
```

Expected: one issue per payslip saying PCB has not been entered. Set `pcb` to `130.5` and re-run — expect `[]`.

- [ ] **Step 4: Finalize and confirm the lock holds**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { finalizePayrollRun, generatePayrollRun } from './src/lib/payroll/run';
const p = new PrismaClient();
const run = await p.payrollRun.findFirstOrThrow({ where: { year: 2024, month: 11 } });
console.log(await finalizePayrollRun(run.id));
const after = await p.payslip.findFirstOrThrow({ where: { runId: run.id } });
console.log({ pdfPath: after.pdfPath ? 'stored' : 'MISSING' });
try { await generatePayrollRun(2024, 11); console.log('BUG: regenerated a finalized run'); }
catch (e) { console.log('correctly refused:', (e as Error).message); }
await p.\$disconnect();
"
```

Expected: `{ ok: true, rendered: 1, failed: 0 }`, then `pdfPath: 'stored'`, then `correctly refused: This payroll run has been finalized and cannot be regenerated.`

- [ ] **Step 5: Clean up and commit**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
await p.payrollRun.deleteMany({ where: { year: 2024, month: 11 } });
await p.user.deleteMany({ where: { email: 'smoke.staff@example.com' } });
await p.\$disconnect();
"
git add src/lib/payroll/run.ts
git commit -m "$(cat <<'MSG'
feat(payroll): validate, finalize and lock a payroll run

Finalize refuses a run with a negative net, an unentered PCB, or a missing
statutory number where that deduction is enabled. Those guards are why the
draft/finalize split exists: each of those payslips looks plausible and is
wrong, and an issued payslip cannot be quietly corrected.

The status flip and rate snapshot are one transaction; PDFs render afterwards,
sequentially, as createInvoiceSubmission already does. Rendering inside the
transaction would hold it open across N renders against a 300s ceiling. If
rendering dies partway the run stays locked with some pdfPath null, which
regenerateMissingPayslipPdfs repairs -- recoverable, unlike an unlocked run
whose PDFs have already been handed out.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Phase 6 — Admin: employees and salary

## Task 14: Validation schemas and employee actions

**Files:**
- Create: `src/lib/payrollValidation.ts`
- Create: `src/lib/employeeCode.ts`
- Create: `src/actions/staff.ts`

**Interfaces:**
- Consumes: `formatEmployeeCode` from `@/lib/payroll/payslipNumber`; `getPayrollSettings`; `hashPassword`, `verifyPassword` from `@/lib/auth`; `requireAdmin`, `requireStaff` from `@/lib/currentUser`; `parseDateInput` from `@/lib/billingDates`
- Produces:
  - `employeeSchema`, `employeeUpdateSchema`, `salaryRecordSchema`, `employmentStatusSchema` from `@/lib/payrollValidation`
  - `generateEmployeeCode(): Promise<string>` from `@/lib/employeeCode`
  - `createEmployee`, `updateEmployee`, `setEmploymentStatus`, `recordSalaryChange`, `staffUpdateProfile`, `changeStaffPassword` from `@/actions/staff`, all `(prevState: FormState, formData: FormData) => Promise<FormState>`

- [ ] **Step 1: Create `src/lib/payrollValidation.ts`**

Follow the idioms in `src/lib/validation.ts` — the `req` helper and `.merge()` composition.

```ts
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
```

- [ ] **Step 2: Create `src/lib/employeeCode.ts`**

```ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { formatEmployeeCode } from "@/lib/payroll/payslipNumber";

/**
 * Next sequential employee code using the configured prefix.
 *
 * Sequential rather than random (unlike vendor codes, which are random to stay
 * short on a printed invoice) because an employee ID is an internal HR
 * reference that people read and sort. Collisions are handled by retry: the
 * unique constraint on employeeCode is the real guarantee, not this count.
 */
export async function generateEmployeeCode(): Promise<string> {
  const settings = await getPayrollSettings();

  for (let attempt = 0; attempt < 20; attempt++) {
    const count = await prisma.employee.count();
    const code = formatEmployeeCode(settings.employeeCodePrefix, count + 1 + attempt);
    const clash = await prisma.employee.findUnique({ where: { employeeCode: code } });
    if (!clash) return code;
  }

  throw new Error("Could not allocate a unique employee code");
}
```

- [ ] **Step 3: Create `src/actions/staff.ts`**

Mirror the structure of `createVendorManually` in `src/actions/admin.ts` — same `FormState`, same `fieldErrors` collection, same `revalidatePath` then `redirect` ending.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { parseDateInput } from "@/lib/billingDates";
import { requireAdmin, requireStaff } from "@/lib/currentUser";
import { generateEmployeeCode } from "@/lib/employeeCode";
import {
  employeeSchema,
  employeeUpdateSchema,
  employmentStatusSchema,
  salaryRecordSchema,
} from "@/lib/payrollValidation";
import { prisma } from "@/lib/prisma";

export type FormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

function collectFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Blank means "fall back to the statutory rate", which is null, not zero. */
const optionalDecimal = (value: string | undefined) =>
  value && value.trim() !== "" ? Number(value) : null;

/** The employee columns shared by create and update. */
function employeeData(d: z.infer<typeof employeeUpdateSchema>) {
  return {
    fullName: d.fullName,
    designation: d.designation,
    department: d.department || null,
    nationality: d.nationality || null,
    gender: d.gender || null,
    nricOrPassport: d.nricOrPassport,
    epfNumber: d.epfNumber || null,
    socsoNumber: d.socsoNumber || null,
    pcbNumber: d.pcbNumber || null,
    email: d.email,
    phone: d.phone,
    addressLine1: d.addressLine1 || null,
    addressLine2: d.addressLine2 || null,
    city: d.city || null,
    postcode: d.postcode || null,
    state: d.state || null,
    country: d.country || null,
    bankName: d.bankName,
    accountNumber: d.accountNumber,
    accountHolderName: d.accountHolderName || null,
    hiredOn: parseDateInput(d.hiredOn),
    epfEnabled: d.epfEnabled,
    socsoEnabled: d.socsoEnabled,
    eisEnabled: d.eisEnabled,
    epfEmployeeRateOverride: optionalDecimal(d.epfEmployeeRateOverride),
    epfEmployerRateOverride: optionalDecimal(d.epfEmployerRateOverride),
    monthlyZakat: optionalDecimal(d.monthlyZakat),
    taxResident: d.taxResident,
    taxWorkerCategory: d.taxWorkerCategory || null,
    taxMaritalStatus: d.taxMaritalStatus || null,
    taxDependents: d.taxDependents,
  };
}

export async function createEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = employeeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existing) {
    return { error: "An account with this email already exists.", fieldErrors: { email: "Email already registered" } };
  }

  const passwordHash = await hashPassword(d.password);
  const employeeCode = await generateEmployeeCode();

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: d.email.toLowerCase(), passwordHash, role: "STAFF" },
    });

    return tx.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        ...employeeData(d),
        // The first SalaryRecord starts the timeline, effective from the hire date.
        salaryRecords: {
          create: [
            {
              monthlySalary: d.monthlySalary,
              effectiveFrom: parseDateInput(d.hiredOn),
              reason: "Starting salary",
            },
          ],
        },
      },
    });
  });

  revalidatePath("/admin/staff");
  redirect(`/admin/staff/${employee.id}`);
}

export async function updateEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = employeeUpdateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  await prisma.employee.update({ where: { id: employeeId }, data: employeeData(parsed.data) });

  revalidatePath(`/admin/staff/${employeeId}`);
  redirect(`/admin/staff/${employeeId}`);
}

export async function setEmploymentStatus(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = employmentStatusSchema.safeParse({
    status: formData.get("status"),
    endedOn: formData.get("endedOn") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status." };
  }

  const { status, endedOn } = parsed.data;
  if (status !== "ACTIVE" && !endedOn) {
    return { error: "An end date is required when an employee resigns or is terminated." };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      status,
      // Clearing endedOn on re-activation matters: proration and run generation
      // both read it, and a stale date would silently exclude the employee.
      endedOn: status === "ACTIVE" ? null : parseDateInput(endedOn!),
    },
  });

  revalidatePath(`/admin/staff/${employeeId}`);
  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Appends to the salary timeline. Never edits an existing record: a raise is a
 * new effective-dated row, so history stays intact and already-finalized months
 * keep resolving to the salary they were actually paid at.
 */
export async function recordSalaryChange(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");

  const parsed = salaryRecordSchema.safeParse({
    monthlySalary: formData.get("monthlySalary"),
    effectiveFrom: formData.get("effectiveFrom"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const effectiveFrom = parseDateInput(parsed.data.effectiveFrom);

  const clash = await prisma.salaryRecord.findFirst({ where: { employeeId, effectiveFrom } });
  if (clash) {
    return {
      error: "A salary record already starts on that date.",
      fieldErrors: { effectiveFrom: "Pick a different effective date" },
    };
  }

  await prisma.salaryRecord.create({
    data: {
      employeeId,
      monthlySalary: parsed.data.monthlySalary,
      effectiveFrom,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath(`/admin/staff/${employeeId}`);
  return { success: true };
}

/** Staff self-service: contact and bank details only. Never statutory fields. */
export async function staffUpdateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
  const employee = await requireStaff();

  const schema = z.object({
    phone: z.string().trim().min(1, "Phone number is required"),
    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    postcode: z.string().trim().optional(),
    state: z.string().trim().optional(),
    country: z.string().trim().optional(),
    bankName: z.string().trim().min(1, "Bank name is required"),
    accountNumber: z.string().trim().min(1, "Account number is required"),
    accountHolderName: z.string().trim().optional(),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: collectFieldErrors(parsed.error.issues) };
  }

  const d = parsed.data;
  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      phone: d.phone,
      addressLine1: d.addressLine1 || null,
      addressLine2: d.addressLine2 || null,
      city: d.city || null,
      postcode: d.postcode || null,
      state: d.state || null,
      country: d.country || null,
      bankName: d.bankName,
      accountNumber: d.accountNumber,
      accountHolderName: d.accountHolderName || null,
    },
  });

  revalidatePath("/staff/profile");
  return { success: true };
}

/** Mirrors changeVendorPassword in src/actions/profile.ts. */
export async function changeStaffPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
  const employee = await requireStaff();

  const schema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: employee.userId } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { success: true };
}
```

- [ ] **Step 4: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/payrollValidation.ts src/lib/employeeCode.ts src/actions/staff.ts
git commit -m "$(cat <<'MSG'
feat(payroll): add employee validation and server actions

Employee codes are sequential rather than random (unlike vendor codes, which
are random to stay short on a printed invoice) because an employee ID is an
internal reference people read and sort.

recordSalaryChange only ever appends. A raise is a new effective-dated row, so
history stays intact and already-finalized months keep resolving to the salary
actually paid. Blank rate overrides store NULL, meaning "use the statutory
rate", not zero.

Staff self-service covers contact and bank details only -- never statutory
identifiers or salary.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 15: Admin employee pages

**Files:**
- Create: `src/app/admin/staff/page.tsx`
- Create: `src/app/admin/staff/new/page.tsx`, `src/app/admin/staff/new/AddStaffForm.tsx`
- Create: `src/app/admin/staff/[id]/page.tsx`, `src/app/admin/staff/[id]/SalaryHistorySection.tsx`, `src/app/admin/staff/[id]/EmploymentStatusForm.tsx`
- Create: `src/app/admin/staff/[id]/edit/page.tsx`, `src/app/admin/staff/[id]/edit/EditStaffForm.tsx`

**Interfaces:**
- Consumes: all actions from Task 14; `StatCard`, `Badge`, `statusBadgeVariant`, `FormField`, `ErrorBanner`, `SuccessBanner`
- Produces: no exported API — these are route components

Every page is an async server component starting `await requireAdmin()`. Dynamic params are a Promise in Next 16: `{ params }: { params: Promise<{ id: string }> }`, then `const { id } = await params`. Read `src/app/admin/vendors/[id]/page.tsx` for the established shape and `src/app/admin/vendors/new/AddVendorForm.tsx` for the client-form shape.

- [ ] **Step 1: `/admin/staff` — the list**

Server component. Query:

```ts
const employees = await prisma.employee.findMany({
  include: { salaryRecords: { orderBy: { effectiveFrom: "desc" }, take: 1 } },
  orderBy: [{ status: "asc" }, { employeeCode: "asc" }],
});
```

Layout: `g6-page-title` "Staff" with a `g6-btn g6-btn-primary` link to `/admin/staff/new` labelled "+ Add Staff". Then `g6-table-wrap > g6-table` with columns **Employee ID** (`font-mono-g6`), **Name**, **Designation**, **Department**, **Status** (`<Badge variant={employeeStatusVariant(e.status)}>`), **Current Salary** (`font-mono-g6`, `formatMoney(Number(e.salaryRecords[0]?.monthlySalary ?? 0))`), and a right-aligned link to `/admin/staff/${e.id}` reading "View".

Add to `src/components/Badge.tsx`:

```ts
export function employeeStatusVariant(status: string): keyof typeof VARIANTS {
  switch (status) {
    case "ACTIVE":
      return "paid";
    case "RESIGNED":
      return "draft";
    case "TERMINATED":
      return "overdue";
    default:
      return "draft";
  }
}
```

Empty state: a single row, `colSpan={7}`, `className="py-8 text-center text-[#5c5770]"`, reading "No staff yet."

- [ ] **Step 2: `/admin/staff/new` — create**

Page is a thin server component rendering `<AddStaffForm />`, with `g6-page-title` "Add Staff" and a `g6-page-subtitle` reading "Creates a staff account with an admin-set initial password. The employee can change it after signing in."

`AddStaffForm.tsx` is `"use client"` using `useActionState(createEmployee, {})`. Group fields in `g6-card p-6` sections with `g6-section-label` headings:

1. **Identity** — fullName, designation, department, nationality, gender
2. **Statutory identifiers** — nricOrPassport, epfNumber, socsoNumber, pcbNumber
3. **Contact & login** — email, phone, password
4. **Home address** — addressLine1, addressLine2, city, postcode, state, country
5. **Bank details** — bankName, accountNumber, accountHolderName
6. **Employment** — hiredOn (`type="date"`), monthlySalary (`type="number"`)
7. **Statutory applicability** — three checkboxes (`epfEnabled`, `socsoEnabled`, `eisEnabled`), all `defaultChecked`; then epfEmployeeRateOverride and epfEmployerRateOverride with placeholder "Leave blank for the statutory rate"; monthlyZakat
8. **PCB profile** — a `taxResident` checkbox (`defaultChecked`), taxWorkerCategory (default "Normal Worker"), taxMaritalStatus, taxDependents. Above this group put a `text-[11px] text-[#8781a0]` note: "These fields do not calculate anything. PCB is entered per payslip; this records which profile the figure was looked up against and prints it as a payslip footnote."

Use `<FormField>` for every text/number input, passing `error={state.fieldErrors?.fieldName}`. Checkboxes are plain inputs with a `g6-label` — `FormField` has no checkbox mode. Render `<ErrorBanner>{state.error}</ErrorBanner>` above the form when set, and a submit button `g6-btn g6-btn-primary w-full` reading "Create Staff Account" / "Creating..." while pending.

**Important:** `z.coerce.boolean()` treats any non-empty string as true, and an unchecked HTML checkbox submits nothing at all — which coerces to `false` correctly. Do not add a hidden fallback input; that would make every checkbox permanently true.

- [ ] **Step 3: `/admin/staff/[id]` — detail**

Query:

```ts
const employee = await prisma.employee.findUnique({
  where: { id },
  include: {
    user: { select: { email: true } },
    salaryRecords: { orderBy: { effectiveFrom: "desc" } },
    payslips: { include: { run: true }, orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }] },
  },
});
if (!employee) notFound();
```

Sections:
- Header: `g6-page-title` with `employee.fullName`, subtitle `designation` + employee code, plus an `g6-btn g6-btn-secondary` link to `./edit` reading "Edit Details"
- Three `StatCard`s: "Current salary" (latest record), "Employment" (status + hiredOn), "Payslips" (count)
- **Profile** `g6-card`: a two-column definition grid of statutory identifiers, contact, address, bank details. Show login email from `employee.user.email`.
- **Salary history**: `<SalaryHistorySection employeeId={id} records={...} />`
- **Employment status**: `<EmploymentStatusForm employeeId={id} status={employee.status} endedOn={...} />`
- **Payslips** `g6-table`: columns Payslip #, Period (`${run.year}-${String(run.month).padStart(2, "0")}`), Gross, Net, Status (`<Badge variant={statusBadgeVariant(run.status === "FINALIZED" ? "APPROVED" : "PENDING")}>`), PDF link to `/api/payslips/${p.id}/pdf` shown only when `p.pdfPath` is set

- [ ] **Step 4: `SalaryHistorySection.tsx`**

`"use client"`, `useActionState(recordSalaryChange, {})`. A `g6-table` of the records — Effective From (`formatDisplayDate` from `@/lib/billingDates`), Monthly Salary (`font-mono-g6`), Reason — newest first, and below it an inline form with `monthlySalary` (number), `effectiveFrom` (date) and `reason` (text) plus a `g6-btn g6-btn-secondary` reading "Record Increment".

Records are never editable or deletable in this build. Put a `text-[11px] text-[#8781a0]` note under the table: "Salary records are append-only. A correction is a new record; increments effective in a month that has already been finalized are paid as a back-pay arrears line on the current payslip."

- [ ] **Step 5: `EmploymentStatusForm.tsx`**

`"use client"`, `useActionState(setEmploymentStatus, {})`. A `<select name="status">` over ACTIVE / RESIGNED / TERMINATED, an `endedOn` date input shown only when the selected status is not ACTIVE, and a confirm button. Show `<SuccessBanner>` on `state.success`.

- [ ] **Step 6: `/admin/staff/[id]/edit`**

Server component loads the employee and renders `<EditStaffForm employee={...} />`. `EditStaffForm.tsx` is `AddStaffForm` minus the password and starting-salary fields, with `defaultValue` on every field and a hidden `employeeId`, wired to `updateEmployee`. Salary is deliberately absent — it changes only through `recordSalaryChange`.

- [ ] **Step 7: Verify in the browser**

```bash
npm run dev
```

As admin: create a staff member, confirm the redirect to the detail page, the employee code follows `G6-EMP-001`, and the starting salary appears in the history. Edit details and confirm they persist. Record an increment effective next month and confirm both rows list newest-first. Then sign out and sign in **as that employee** — confirm the login lands on `/staff` (404 until Task 22) rather than bouncing to `/login`, which proves Task 8's redirect.

- [ ] **Step 8: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/app/admin/staff src/components/Badge.tsx
git commit -m "$(cat <<'MSG'
feat(payroll): add admin staff pages

List, create, detail with salary history, and edit. Salary is absent from the
edit form by design -- it changes only through recordSalaryChange, so the
timeline stays append-only and finalized months keep resolving correctly.

The PCB profile group carries a note that it calculates nothing, so nobody
later mistakes those fields for calculation inputs.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Phase 7 — Admin: running payroll

## Task 16: Payroll server actions

**Files:**
- Create: `src/actions/payroll.ts`

**Interfaces:**
- Consumes: `generatePayrollRun`, `recomputePayslip`, `validateRunForFinalize`, `finalizePayrollRun`, `regenerateMissingPayslipPdfs` from `@/lib/payroll/run`
- Produces: `generateRunAction`, `setPayslipPcbAction`, `updatePayslipLinesAction`, `finalizeRunAction`, `regeneratePdfsAction`, `markRunPaidAction` — all `(prevState, formData) => Promise<FormState>`; plus `PayrollFormState` which extends `FormState` with `issues?: FinalizeIssue[]`

- [ ] **Step 1: Create `src/actions/payroll.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseDateInput } from "@/lib/billingDates";
import { requireAdmin } from "@/lib/currentUser";
import {
  finalizePayrollRun,
  generatePayrollRun,
  recomputePayslip,
  regenerateMissingPayslipPdfs,
  type FinalizeIssue,
} from "@/lib/payroll/run";
import { prisma } from "@/lib/prisma";

export type FormState = {
  error?: string;
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type PayrollFormState = FormState & { issues?: FinalizeIssue[] };

/** Guards every mutation: a finalized run is immutable. */
async function assertRunEditable(runId: string) {
  const run = await prisma.payrollRun.findUniqueOrThrow({ where: { id: runId } });
  if (run.status === "FINALIZED") {
    throw new Error("This run has been finalized and can no longer be edited.");
  }
  return run;
}

export async function generateRunAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      year: z.coerce.number().int().min(2000).max(2100),
      month: z.coerce.number().int().min(1).max(12),
    })
    .safeParse({ year: formData.get("year"), month: formData.get("month") });

  if (!parsed.success) return { error: "Pick a valid month and year." };

  let runId: string;
  try {
    ({ runId } = await generatePayrollRun(parsed.data.year, parsed.data.month));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not generate the run." };
  }

  revalidatePath("/admin/payroll");
  redirect(`/admin/payroll/${runId}`);
}

/**
 * Sets PCB for one payslip and recomputes it.
 *
 * An empty string clears it back to NULL ("not entered"), which is distinct
 * from 0.00 ("confirmed none due") — finalize blocks on the former only.
 */
export async function setPayslipPcbAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const payslipId = String(formData.get("payslipId") ?? "");
  const raw = String(formData.get("pcb") ?? "").trim();

  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    select: { runId: true },
  });
  await assertRunEditable(payslip.runId);

  if (raw !== "") {
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) {
      return { error: "PCB must be zero or greater.", fieldErrors: { pcb: "Enter a valid amount" } };
    }
    await prisma.payslip.update({ where: { id: payslipId }, data: { pcb: value } });
  } else {
    await prisma.payslip.update({ where: { id: payslipId }, data: { pcb: null } });
  }

  await recomputePayslip(payslipId);
  revalidatePath(`/admin/payroll/${payslip.runId}`);
  return { success: true };
}

const lineSchema = z.object({
  kind: z.enum(["EARNING", "WAGE_DEDUCTION", "NET_DEDUCTION"]),
  label: z.string().trim().min(1, "Every line needs a label"),
  units: z.string().trim().optional(),
  rate: z.string().trim().optional(),
  amount: z.coerce.number().positive("Every line needs an amount greater than 0"),
  taxable: z.boolean(),
  epfApplicable: z.boolean(),
  socsoApplicable: z.boolean(),
});

/**
 * Replaces the non-auto lines on a draft payslip, then recomputes.
 *
 * The auto salary line is untouched: it is derived from the salary timeline and
 * the month, and editing it here would put the payslip out of step with the
 * SalaryRecord it came from. A correction to pay belongs in a new line (an
 * arrears earning, or an unpaid-leave wage deduction).
 */
export async function updatePayslipLinesAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const payslipId = String(formData.get("payslipId") ?? "");

  const payslip = await prisma.payslip.findUniqueOrThrow({
    where: { id: payslipId },
    select: { runId: true },
  });
  await assertRunEditable(payslip.runId);

  let rows: unknown;
  try {
    rows = JSON.parse(String(formData.get("rows") ?? "[]"));
  } catch {
    return { error: "Invalid payslip lines." };
  }

  const parsed = z.array(lineSchema).safeParse(rows);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the payslip lines." };
  }

  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.$transaction([
    prisma.payslipLine.deleteMany({ where: { payslipId, autoGenerated: false } }),
    prisma.payslip.update({
      where: { id: payslipId },
      data: {
        notes: notes || null,
        lines: {
          create: parsed.data.map((line, index) => ({
            kind: line.kind,
            label: line.label,
            units: line.units ? Number(line.units) : null,
            rate: line.rate ? Number(line.rate) : null,
            amount: line.amount,
            taxable: line.taxable,
            epfApplicable: line.epfApplicable,
            socsoApplicable: line.socsoApplicable,
            autoGenerated: false,
            // sortOrder 0 belongs to the auto salary line.
            sortOrder: index + 1,
          })),
        },
      },
    }),
  ]);

  await recomputePayslip(payslipId);
  revalidatePath(`/admin/payroll/${payslip.runId}`);
  redirect(`/admin/payroll/${payslip.runId}`);
}

/**
 * Finalizes a run. Returns validation issues in state rather than throwing, so
 * the page can list exactly which payslips are blocking and why.
 */
export async function finalizeRunAction(
  _prevState: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  await requireAdmin();
  const runId = String(formData.get("runId") ?? "");

  if (formData.get("acknowledged") !== "on") {
    return { error: "Tick the acknowledgement before finalizing." };
  }

  const result = await finalizePayrollRun(runId);
  revalidatePath(`/admin/payroll/${runId}`);
  revalidatePath("/admin/payroll");

  if (!result.ok) {
    return { error: "This run cannot be finalized yet.", issues: result.issues };
  }

  return {
    success: true,
    message:
      result.failed === 0
        ? `Run finalized. ${result.rendered} payslip(s) issued.`
        : `Run finalized and locked, but ${result.failed} PDF(s) failed to render. Use "Regenerate missing PDFs".`,
  };
}

export async function regeneratePdfsAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const runId = String(formData.get("runId") ?? "");

  const repaired = await regenerateMissingPayslipPdfs(runId);
  revalidatePath(`/admin/payroll/${runId}`);

  return { success: true, message: repaired === 0 ? "No payslips were missing a PDF." : `Regenerated ${repaired} PDF(s).` };
}

export async function markRunPaidAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const runId = String(formData.get("runId") ?? "");

  const parsed = z
    .object({
      paidAt: z.string().trim().min(1, "Payment date is required"),
      paymentReference: z.string().trim().optional(),
    })
    .safeParse({ paidAt: formData.get("paidAt"), paymentReference: formData.get("paymentReference") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a payment date." };
  }

  const run = await prisma.payrollRun.findUniqueOrThrow({ where: { id: runId } });
  if (run.status !== "FINALIZED") {
    return { error: "Finalize the run before marking it paid." };
  }

  await prisma.payrollRun.update({
    where: { id: runId },
    data: {
      paymentStatus: "PAID",
      paidAt: parseDateInput(parsed.data.paidAt),
      paymentReference: parsed.data.paymentReference || null,
    },
  });

  revalidatePath(`/admin/payroll/${runId}`);
  revalidatePath("/admin/payroll");
  revalidatePath("/staff/payslips");
  return { success: true };
}
```

- [ ] **Step 2: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/actions/payroll.ts
git commit -m "$(cat <<'MSG'
feat(payroll): add payroll run server actions

Every mutation goes through assertRunEditable, so a finalized run is immutable
regardless of which form posted to it.

setPayslipPcbAction distinguishes an empty input (NULL, "not entered") from
0.00 ("confirmed none due"); finalize blocks on the former only.

updatePayslipLinesAction never touches the auto salary line -- that is derived
from the salary timeline, and editing it here would desync the payslip from the
SalaryRecord behind it. Pay corrections belong in a new arrears or unpaid-leave
line.

finalizeRunAction returns validation issues in state rather than throwing, so
the page can name which payslips are blocking and why.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 17: Payroll list and run review pages

**Files:**
- Create: `src/app/admin/payroll/page.tsx`, `src/app/admin/payroll/GenerateRunForm.tsx`
- Create: `src/app/admin/payroll/[id]/page.tsx`, `src/app/admin/payroll/[id]/PcbInlineInput.tsx`, `src/app/admin/payroll/[id]/FinalizeRunForm.tsx`, `src/app/admin/payroll/[id]/RegeneratePdfsButton.tsx`

**Interfaces:**
- Consumes: actions from Task 16; `getPayrollSettings`; `formatMoney` from `@/lib/stats`; `Badge`, `StatCard`
- Produces: route components only

- [ ] **Step 1: `/admin/payroll` — the run list**

```ts
const [runs, settings] = await Promise.all([
  prisma.payrollRun.findMany({
    include: { _count: { select: { payslips: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  }),
  getPayrollSettings(),
]);
```

Header `g6-page-title` "Payroll" with `<GenerateRunForm />` on the right.

**The unverified-bands warning goes here and on the run page.** When `settings.bandsVerifiedAt === null`, render above everything:

```tsx
<div className="g6-panel border-[color-mix(in_srgb,var(--g6-pending)_45%,transparent)] p-4">
  <p className="text-[13px] font-semibold text-[#f7c96e]">SOCSO and EIS tables are unverified</p>
  <p className="mt-1 text-[12px] text-[#a09bb5]">
    These tables were generated from the configured rates, not taken from the official PERKESO
    schedule. Reconcile them in{" "}
    <Link href="/admin/payroll-settings" className="text-[#9d84ff] hover:text-[#cabfff]">Payroll Settings</Link>{" "}
    before running real payroll.
  </p>
</div>
```

Then a `g6-table`: **Period** (`${year}-${MM}`, `font-mono-g6`), **Status** (Badge — FINALIZED maps to `paid`, DRAFT to `draft`), **Payslips** (`_count.payslips`), **Payment** (Badge over `paymentStatus`), **Finalized** (date or `—`), and a "Open" link to `/admin/payroll/${run.id}`.

`GenerateRunForm.tsx` is `"use client"` on `generateRunAction`: a month `<select>` (January–December), a year `<input type="number">` defaulting to the current UTC year, and a `g6-btn g6-btn-primary` reading "Generate Payroll". Default the month to the **previous** calendar month, since payroll is run after the month ends.

- [ ] **Step 2: `/admin/payroll/[id]` — the run**

```ts
const { id } = await params;
const run = await prisma.payrollRun.findUnique({
  where: { id },
  include: {
    payslips: {
      include: { employee: { select: { employeeCode: true } }, lines: true },
      orderBy: { payslipNumber: "asc" },
    },
  },
});
if (!run) notFound();

const totals = run.payslips.reduce(
  (acc, p) => ({
    gross: acc.gross + Number(p.grossPay),
    net: acc.net + Number(p.netPay),
    employerCost: acc.employerCost + Number(p.totalEmployerCost),
  }),
  { gross: 0, net: 0, employerCost: 0 }
);
const isDraft = run.status === "DRAFT";
const missingPdfs = run.payslips.filter((p) => !p.pdfPath).length;
```

Header: title `Payroll — ${monthName} ${run.year}` plus a status Badge. Three `StatCard`s: "Total gross", "Total net pay", "Total employer cost".

Main `g6-table` — columns **Payslip #** (`font-mono-g6`), **Employee**, **Days** (`proratedDays === daysInMonth ? "Full" : \`${proratedDays}/${daysInMonth}\``), **Gross**, **EPF**, **SOCSO**, **EIS**, **PCB**, **Net**, then actions. All money `font-mono-g6` and right-aligned.

- PCB cell: `isDraft ? <PcbInlineInput payslipId={p.id} value={p.pcb} /> : formatMoney(Number(p.pcb))`
- Actions: when draft, a link to `./payslips/${p.id}/edit` reading "Edit lines"; when finalized, a link to `/api/payslips/${p.id}/pdf` reading "PDF" (or the text "PDF missing" in `text-[#ff9494]` when `pdfPath` is null)
- Highlight any row with `Number(p.netPay) < 0` using `text-[#ff9494]` on the Net cell — it blocks finalize, so it should be visible before the attempt

Below the table:
- when `isDraft`: `<FinalizeRunForm runId={run.id} bandsVerified={settings.bandsVerifiedAt !== null} />`
- when finalized and `missingPdfs > 0`: `<RegeneratePdfsButton runId={run.id} missing={missingPdfs} />`
- when finalized and unpaid: `<MarkRunPaidForm runId={run.id} />` (Task 23)

Also repeat the unverified-bands warning from step 1 when `settings.bandsVerifiedAt === null`.

- [ ] **Step 3: `PcbInlineInput.tsx`**

`"use client"` on `setPayslipPcbAction`. A tiny inline form: a hidden `payslipId`, one `<input name="pcb" type="number" step="0.01" min="0" className="g6-input py-1 text-xs w-24">` with `defaultValue={value === null ? "" : Number(value).toFixed(2)}` and `placeholder="Not set"`, submitting on blur via `requestSubmit()` as well as on Enter. When `value === null`, add `className` ring `g6-input-error` so unentered PCB is visually obvious across the whole table.

- [ ] **Step 4: `FinalizeRunForm.tsx`**

`"use client"` on `finalizeRunAction` with `PayrollFormState`. Renders:

- a `g6-card p-6` with heading "Finalize this run"
- explanatory copy: "Finalizing locks every payslip in this run, records the rates used, and renders the PDFs. Locked payslips cannot be edited — a later correction is made as an adjustment line on a future payslip."
- a required checkbox `name="acknowledged"`. Its label depends on `bandsVerified`: when false, "I understand the SOCSO and EIS tables have not been reconciled against the official PERKESO schedule."; when true, "I have reviewed every payslip in this run."
- `g6-btn g6-btn-primary` reading "Finalize & Issue Payslips" / "Finalizing..."
- when `state.issues` is set, a `g6-panel` listing each issue as `<li>` with `employeeName` in `font-semibold` and `message` in `text-[#ff9494]`, under the heading "Fix these before finalizing"
- `<SuccessBanner>{state.message}</SuccessBanner>` on success

- [ ] **Step 5: `RegeneratePdfsButton.tsx`**

`"use client"` on `regeneratePdfsAction`. A `g6-panel p-4` warning that `{missing}` payslip(s) have no PDF, and a `g6-btn g6-btn-secondary` reading "Regenerate missing PDFs", showing `state.message` after.

- [ ] **Step 6: Verify the whole flow in the browser**

```bash
npm run dev
```

1. Create two staff members with different salaries — one under RM5,000 and one over, so both EPF employer rates get exercised.
2. Generate last month's payroll. Confirm two rows, correct gross, and PCB showing as unset with the error ring.
3. Try to finalize without PCB — confirm the issue list names both employees.
4. Enter PCB for both, confirm the Net column updates after each blur.
5. Finalize. Confirm the status flips, PDF links appear, and the run page no longer offers editing.
6. Open a PDF and check it against the reference layout.
7. Try to generate the same month again from `/admin/payroll` — confirm the error rather than a silent overwrite.

- [ ] **Step 7: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/app/admin/payroll
git commit -m "$(cat <<'MSG'
feat(payroll): add payroll run list and review pages

The review table is where PCB gets entered and where a negative net becomes
visible before finalize refuses it, rather than after.

Both pages carry a warning while PayrollSettings.bandsVerifiedAt is null, and
the finalize acknowledgement changes wording to name that specific risk. It
warns rather than blocks -- blocking would leave the portal unusable until
someone tracks down the PERKESO schedule.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 18: Payslip line editor

**Files:**
- Create: `src/app/admin/payroll/[id]/payslips/[payslipId]/edit/page.tsx`
- Create: `src/app/admin/payroll/[id]/payslips/[payslipId]/PayslipLinesEditor.tsx`

**Interfaces:**
- Consumes: `updatePayslipLinesAction` from Task 16
- Produces: route components only

A sibling of `src/components/TaskRowsEditor.tsx`, not a generalisation of it. Read that file for the JSON-in-a-hidden-field pattern, then diverge: the columns, the three line kinds and the three flag checkboxes have nothing in common with task rows, and forcing one component to serve both would need a config-driven column system.

- [ ] **Step 1: The page**

Server component. `const { id, payslipId } = await params;` then:

```ts
const payslip = await prisma.payslip.findUnique({
  where: { id: payslipId },
  include: { lines: { orderBy: { sortOrder: "asc" } }, run: true },
});
if (!payslip || payslip.runId !== id) notFound();
if (payslip.run.status === "FINALIZED") redirect(`/admin/payroll/${id}`);
```

Render the employee name and payslip number as the title, then a read-only `g6-panel` showing the auto salary line (label, days, amount) with the note "The salary line is derived from the salary timeline and this month's dates. To adjust pay, add an arrears earning or an unpaid-leave deduction below." Then `<PayslipLinesEditor payslipId={payslipId} initialRows={...} initialNotes={payslip.notes ?? ""} />`, passing only `lines.filter((l) => !l.autoGenerated)` mapped to string-valued rows.

- [ ] **Step 2: `PayslipLinesEditor.tsx`**

`"use client"`, `useActionState(updatePayslipLinesAction, {})`, rows held in `useState`, serialised into `<input type="hidden" name="rows" value={JSON.stringify(rows)} />`.

Row type:

```ts
export type PayslipLineRow = {
  kind: "EARNING" | "WAGE_DEDUCTION" | "NET_DEDUCTION";
  label: string;
  units: string;
  rate: string;
  amount: string;
  taxable: boolean;
  epfApplicable: boolean;
  socsoApplicable: boolean;
};

export function emptyPayslipLineRow(): PayslipLineRow {
  return {
    kind: "EARNING",
    label: "",
    units: "",
    rate: "",
    amount: "",
    taxable: true,
    epfApplicable: true,
    socsoApplicable: true,
  };
}
```

Table columns: **Kind** (`<select>` over the three kinds), **Label**, **Units**, **Rate**, **Amount**, **Taxable**, **EPF**, **SOCSO** (three checkboxes), **Remove**.

Two behaviours that carry the domain rules into the UI:

1. **Selecting `NET_DEDUCTION` forces all three flags off and disables the checkboxes**, with `title="Net deductions come out of pay after contributions, so they never affect a contribution base."` A net deduction with a flag set is meaningless and the engine ignores the flags anyway — disabling them stops an admin believing otherwise.
2. **A live preview line** under the table: `Earnings +X · Wage deductions -Y · Net deductions -Z`, computed client-side from the rows. Not authoritative — the server recomputes — but it catches a mistyped amount before submitting.

Include a short legend in `text-[11px] text-[#8781a0]`:

- **Earning** — adds to pay. Use for allowances, overtime, bonuses and back-pay arrears.
- **Wage deduction** — reduces pay *and* the EPF, SOCSO and tax bases. Use for unpaid leave.
- **Net deduction** — comes out of pay after contributions, leaving the bases untouched. Use for salary advances and staff loans.

Hidden `payslipId`, a `notes` textarea, "+ Add Line" (`g6-btn g6-btn-secondary`), and a submit button reading "Save Lines" / "Saving...".

- [ ] **Step 3: Verify**

On a draft payslip for a RM5,300 employee:
1. Add a `NET_DEDUCTION` of 300 → net drops by 300, and **EPF stays at 583.00**.
2. Change it to `WAGE_DEDUCTION` → gross drops to 5,000 and the EPF employer figure changes to 650.00, because the base crossed the RM5,000 threshold.

That contrast is the feature working. If EPF moves in case 1, `baseCents` in `calc.ts` is wrong.

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/app/admin/payroll
git commit -m "$(cat <<'MSG'
feat(payroll): add the payslip line editor

A sibling of TaskRowsEditor rather than a generalisation: the columns, three
line kinds and three statutory flags share nothing with task rows, and one
component serving both would need a config-driven column system.

Choosing NET_DEDUCTION disables the flag checkboxes, since a net deduction
never touches a contribution base and the engine ignores the flags anyway.
Leaving them editable would imply otherwise.

The salary line is shown read-only with an explanation, so corrections are made
as arrears or unpaid-leave lines instead of by editing derived pay.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Phase 8 — Admin: payroll settings

## Task 19: Employer details, rates and payslip design

**Files:**
- Create: `src/actions/payrollSettings.ts`
- Create: `src/app/admin/payroll-settings/page.tsx`, `EmployerDetailsForm.tsx`, `RatesForm.tsx`, `PayslipDesignForm.tsx`

**Interfaces:**
- Consumes: `getPayrollSettings`; `saveUploadedFile` from `@/lib/storage`
- Produces: `updateEmployerDetailsAction`, `updateRatesAction`, `updatePayslipDesignAction` from `@/actions/payrollSettings`

- [ ] **Step 1: Create `src/actions/payrollSettings.ts`**

Mirror `src/actions/orgSettings.ts` (upsert on `id: "singleton"`) and `src/actions/invoiceSettings.ts` (the conditional file-upload pattern).

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";

export type FormState = { error?: string; success?: boolean; fieldErrors?: Record<string, string> };

const SINGLETON = { id: "singleton" };

async function saveSettings(data: Record<string, unknown>) {
  await prisma.payrollSettings.upsert({
    where: SINGLETON,
    create: { ...SINGLETON, ...data },
    update: data,
  });
  revalidatePath("/admin/payroll-settings");
}

export async function updateEmployerDetailsAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      employeeCodePrefix: z.string().trim().min(1, "Employee code prefix is required"),
      businessRegNumber: z.string().trim().optional(),
      epfEmployerNumber: z.string().trim().optional(),
      socsoEmployerNumber: z.string().trim().optional(),
      lhdnEmployerNumber: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the employer details." };

  const d = parsed.data;
  await saveSettings({
    employeeCodePrefix: d.employeeCodePrefix,
    businessRegNumber: d.businessRegNumber || null,
    epfEmployerNumber: d.epfEmployerNumber || null,
    socsoEmployerNumber: d.socsoEmployerNumber || null,
    lhdnEmployerNumber: d.lhdnEmployerNumber || null,
  });
  return { success: true };
}

const rate = (label: string, max = 100) =>
  z.coerce.number().min(0, `${label} cannot be negative`).max(max, `${label} looks too high`);

export async function updateRatesAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      epfEmployeeRate: rate("EPF employee rate"),
      epfEmployerRate: rate("EPF employer rate"),
      epfEmployerRateBelowThreshold: rate("EPF employer rate below threshold"),
      epfEmployerThreshold: z.coerce.number().min(0, "Threshold cannot be negative"),
      socsoEmployeeRate: rate("SOCSO employee rate", 10),
      socsoEmployerRate: rate("SOCSO employer rate", 10),
      socsoWageCeiling: z.coerce.number().positive("SOCSO wage ceiling must be greater than 0"),
      socsoBandWidth: z.coerce.number().positive("SOCSO band width must be greater than 0"),
      eisEmployeeRate: rate("EIS employee rate", 10),
      eisEmployerRate: rate("EIS employer rate", 10),
      eisWageCeiling: z.coerce.number().positive("EIS wage ceiling must be greater than 0"),
      eisBandWidth: z.coerce.number().positive("EIS band width must be greater than 0"),
      hrdfEnabled: z.coerce.boolean(),
      hrdfRate: rate("HRDF rate", 10),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please fix the errors below.", fieldErrors };
  }

  // Changing SOCSO/EIS rates does NOT rebuild the band tables. That is a
  // separate, explicit action (Task 20) because it rewrites statutory data,
  // and because finalized runs must keep the rates they were issued with.
  await saveSettings(parsed.data);
  return { success: true };
}

export async function updatePayslipDesignAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      accentColor: z
        .string()
        .trim()
        .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour such as #18181b"),
      showEmployerContributions: z.coerce.boolean(),
      showHrdfColumn: z.coerce.boolean(),
      showZakatColumn: z.coerce.boolean(),
      epfFootnote: z.string().trim().max(300).optional(),
      payslipFooterText: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the design settings." };

  const logo = formData.get("payslipLogo");
  const logoUrl =
    logo instanceof File && logo.size > 0
      ? (await saveUploadedFile(logo, "payroll/logo")).url
      : undefined;

  const d = parsed.data;
  await saveSettings({
    accentColor: d.accentColor,
    showEmployerContributions: d.showEmployerContributions,
    showHrdfColumn: d.showHrdfColumn,
    showZakatColumn: d.showZakatColumn,
    epfFootnote: d.epfFootnote || null,
    payslipFooterText: d.payslipFooterText || null,
    ...(logoUrl ? { payslipLogoUrl: logoUrl } : {}),
  });
  return { success: true };
}
```

- [ ] **Step 2: `/admin/payroll-settings` — the page**

Server component: `await requireAdmin()`, load `getPayrollSettings()` and `prisma.statutoryBand.findMany({ orderBy: [{ type: "asc" }, { wageFrom: "asc" }] })`.

Tabs are driven by a `?tab=` search param (no client state needed), defaulting to `employer`. Render the tab strip with the same markup as the status filter in `src/app/admin/invoices/page.tsx` — links styled `rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold`, active one `bg-white/[0.08] text-[#ece9f5]`. Tabs: `employer`, `rates`, `socso`, `eis`, `design`.

Above the tabs, a `g6-panel` note: "Company name and address come from Billing Settings — the employing entity is the same one that appears as Bill To on vendor invoices." with a link to `/admin/settings`.

- [ ] **Step 3: `EmployerDetailsForm.tsx`**

`"use client"` on `updateEmployerDetailsAction`. `FormField`s for `employeeCodePrefix`, `businessRegNumber`, `epfEmployerNumber`, `socsoEmployerNumber`, `lhdnEmployerNumber`, with `defaultValue` from settings. Note under the prefix field: "Only affects codes allocated from now on. Existing employee codes are unchanged."

- [ ] **Step 4: `RatesForm.tsx`**

`"use client"` on `updateRatesAction`, grouped into `g6-card` sections:

- **EPF / KWSP** — `epfEmployeeRate`, `epfEmployerRate`, `epfEmployerRateBelowThreshold`, `epfEmployerThreshold`. Note: "The employer rate is the *below threshold* rate at or below the threshold amount, and the main rate above it. Statutory values are 13% at or below RM5,000 and 12% above."
- **SOCSO** and **EIS** — rates, ceiling, band width each. Note on both: "These rates generate the band table rather than being applied to salary directly — 0.5% of 5,300 is 26.50, but the statutory figure is 26.25 because it derives from the band midpoint. Saving a rate here does not rebuild the table; use the SOCSO or EIS tab to regenerate."
- **HRDF** — `hrdfEnabled` checkbox and `hrdfRate`. Note: "An employer-only levy. Enable only if the company is registered under the PSMB Act."

Use `step="0.001"` on the SOCSO/EIS rate inputs — they are stored to three decimals.

- [ ] **Step 5: `PayslipDesignForm.tsx`**

`"use client"` on `updatePayslipDesignAction`, `encType` handled automatically by the action. Logo file input (`name="payslipLogo"`, `accept="image/png,image/jpeg,image/svg+xml"`), `accentColor` as `type="color"` plus a text mirror, the three display checkboxes, and the two textareas. Show the current logo when `payslipLogoUrl` is set. Note beside `epfFootnote`: "Leave blank to generate it from the EPF rates actually used on each payslip."

- [ ] **Step 6: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/actions/payrollSettings.ts src/app/admin/payroll-settings
git commit -m "$(cat <<'MSG'
feat(payroll): add payroll settings for employer details, rates and design

Saving a SOCSO or EIS rate deliberately does not rebuild the band table. That
is a separate explicit action: it rewrites statutory data, and finalized runs
must keep the rates they were issued with.

Company name and address stay in Billing Settings rather than being duplicated
here -- the employing entity is the same one that appears as Bill To on vendor
invoices, so there is no second address to drift.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 20: Band editor — regenerate, edit, import, verify

**Files:**
- Create: `src/actions/statutoryBands.ts`
- Create: `src/app/admin/payroll-settings/BandEditor.tsx`

**Interfaces:**
- Consumes: `generateBands` from `@/lib/payroll/bands`; `getPayrollSettings`
- Produces: `regenerateBandsAction`, `updateBandAction`, `importBandsCsvAction`, `verifyBandsAction`

- [ ] **Step 1: Create `src/actions/statutoryBands.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/currentUser";
import { generateBands } from "@/lib/payroll/bands";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; success?: boolean; message?: string };

const bandType = z.enum(["SOCSO", "EIS"]);

/**
 * Rebuilds the GENERATED rows for one table from the configured rates.
 *
 * MANUAL rows are left alone: once an admin has corrected a band against the
 * official schedule, a later regeneration must not silently undo that. It also
 * clears the verification stamp, because the table has changed and whatever was
 * verified before no longer describes it.
 */
export async function regenerateBandsAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = bandType.safeParse(formData.get("type"));
  if (!parsed.success) return { error: "Unknown band table." };
  const type = parsed.data;

  const settings = await getPayrollSettings();
  const bands = generateBands(
    type === "SOCSO"
      ? {
          employeeRate: Number(settings.socsoEmployeeRate),
          employerRate: Number(settings.socsoEmployerRate),
          wageCeiling: Number(settings.socsoWageCeiling),
          bandWidth: Number(settings.socsoBandWidth),
        }
      : {
          employeeRate: Number(settings.eisEmployeeRate),
          employerRate: Number(settings.eisEmployerRate),
          wageCeiling: Number(settings.eisWageCeiling),
          bandWidth: Number(settings.eisBandWidth),
        }
  );

  const manual = await prisma.statutoryBand.findMany({
    where: { type, source: "MANUAL" },
    select: { wageFrom: true },
  });
  const keep = new Set(manual.map((row) => Number(row.wageFrom)));

  await prisma.$transaction([
    prisma.statutoryBand.deleteMany({ where: { type, source: "GENERATED" } }),
    prisma.statutoryBand.createMany({
      data: bands
        .filter((band) => !keep.has(band.wageFrom))
        .map((band) => ({ type, ...band, source: "GENERATED" as const })),
    }),
    prisma.payrollSettings.update({
      where: { id: "singleton" },
      data: { bandsGeneratedAt: new Date(), bandsVerifiedAt: null, bandsVerifiedBy: null },
    }),
  ]);

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return {
    success: true,
    message: `Regenerated ${bands.length - keep.size} ${type} band(s). ${keep.size} manually-edited band(s) kept.`,
  };
}

/** Editing a band flips it to MANUAL so regeneration will not overwrite it. */
export async function updateBandAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      id: z.string().min(1),
      employeeAmount: z.coerce.number().min(0, "Amount cannot be negative"),
      employerAmount: z.coerce.number().min(0, "Amount cannot be negative"),
    })
    .safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid band." };

  await prisma.statutoryBand.update({
    where: { id: parsed.data.id },
    data: {
      employeeAmount: parsed.data.employeeAmount,
      employerAmount: parsed.data.employerAmount,
      source: "MANUAL",
    },
  });

  revalidatePath("/admin/payroll-settings");
  return { success: true };
}

/**
 * Replaces a whole table from pasted CSV, so the official PERKESO schedule can
 * be transcribed wholesale rather than edited row by row. Imported rows land as
 * MANUAL — they came from the authority, not from our rule.
 *
 * Expected columns: wageFrom,wageTo,employeeAmount,employerAmount
 * A header row is detected and skipped.
 */
export async function importBandsCsvAction(_p: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const typeParsed = bandType.safeParse(formData.get("type"));
  if (!typeParsed.success) return { error: "Unknown band table." };
  const type = typeParsed.data;

  const csv = String(formData.get("csv") ?? "").trim();
  if (!csv) return { error: "Paste the CSV rows first." };

  const rows: { wageFrom: number; wageTo: number; employeeAmount: number; employerAmount: number }[] = [];

  for (const [index, rawLine] of csv.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;

    const cells = line.split(",").map((cell) => cell.trim().replace(/[",]/g, ""));
    if (cells.length < 4) return { error: `Line ${index + 1} has fewer than four columns.` };

    const values = cells.slice(0, 4).map(Number);
    // Skip a header row rather than failing on it.
    if (index === 0 && values.some((value) => Number.isNaN(value))) continue;
    if (values.some((value) => Number.isNaN(value))) {
      return { error: `Line ${index + 1} contains a value that is not a number.` };
    }

    const [wageFrom, wageTo, employeeAmount, employerAmount] = values;
    if (wageTo <= wageFrom) return { error: `Line ${index + 1}: wageTo must be greater than wageFrom.` };
    rows.push({ wageFrom, wageTo, employeeAmount, employerAmount });
  }

  if (rows.length === 0) return { error: "No usable rows found." };

  const duplicate = rows.length !== new Set(rows.map((row) => row.wageFrom)).size;
  if (duplicate) return { error: "Two rows share the same wageFrom." };

  await prisma.$transaction([
    prisma.statutoryBand.deleteMany({ where: { type } }),
    prisma.statutoryBand.createMany({
      data: rows.map((row) => ({ type, ...row, source: "MANUAL" as const })),
    }),
    prisma.payrollSettings.update({
      where: { id: "singleton" },
      data: { bandsVerifiedAt: null, bandsVerifiedBy: null },
    }),
  ]);

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return { success: true, message: `Imported ${rows.length} ${type} band(s).` };
}

/** Records that an admin has reconciled both tables against the official schedule. */
export async function verifyBandsAction(_p: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  if (formData.get("confirmed") !== "on") {
    return { error: "Tick the confirmation first." };
  }

  await prisma.payrollSettings.update({
    where: { id: "singleton" },
    data: { bandsVerifiedAt: new Date(), bandsVerifiedBy: admin.email },
  });

  revalidatePath("/admin/payroll-settings");
  revalidatePath("/admin/payroll");
  return { success: true, message: "Bands marked as verified." };
}
```

- [ ] **Step 2: `BandEditor.tsx`**

`"use client"`, props `{ type: "SOCSO" | "EIS"; bands: BandRow[]; verifiedAt: Date | null; verifiedBy: string | null; generatedAt: Date | null }`.

Layout:

1. A status `g6-panel`. When `verifiedAt` is null: `text-[#f7c96e]` reading "Generated from the configured rates on {generatedAt}, not verified against the official PERKESO schedule." When set: `text-[#5ee8c0]` reading "Verified by {verifiedBy} on {verifiedAt}."
2. A `g6-table`: **Wage range** (`(wageFrom + 0.01).toFixed(2)` – `wageTo.toFixed(2)`, `font-mono-g6`), **Employee**, **Employer**, **Source** (`<Badge variant={band.source === "MANUAL" ? "paid" : "draft"}>`), and an **Edit** action that swaps the two amount cells for inputs wired to `updateBandAction`.
3. A "Regenerate from rates" `g6-btn g6-btn-secondary` on `regenerateBandsAction` with a hidden `type`, and copy: "Rebuilds every generated band from the configured rates. Manually edited bands are kept."
4. A collapsible "Import CSV" block on `importBandsCsvAction`: a textarea, the expected header `wageFrom,wageTo,employeeAmount,employerAmount`, and a `g6-btn g6-btn-danger` labelled "Replace table with CSV" — it is destructive, since it deletes every existing row for that type.
5. A "Mark as verified" form on `verifyBandsAction` with a required checkbox: "I have reconciled every band in both tables against the official PERKESO schedule."

Note that the wage range displays as `wageFrom + 0.01` because a band covers the half-open interval `(wageFrom, wageTo]` — matching how PERKESO prints "5,200.01 – 5,300.00".

- [ ] **Step 3: Verify**

1. Open the SOCSO tab, confirm 60 rows, all `GENERATED`, and the unverified warning.
2. Edit the 5,200.01–5,300.00 band's employer amount to 91.90, confirm it flips to `MANUAL`.
3. Regenerate — confirm the message says one manually-edited band was kept, and that the row still reads 91.90.
4. Edit it back to 91.85 and regenerate again.
5. Mark as verified; confirm the warnings on `/admin/payroll` and the finalize form both disappear.
6. Regenerate once more; confirm verification is cleared and the warnings return.

Step 6 is the important one — a changed table must not keep a stale verification stamp.

- [ ] **Step 4: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/actions/statutoryBands.ts src/app/admin/payroll-settings
git commit -m "$(cat <<'MSG'
feat(payroll): make statutory bands admin-editable

Regeneration rewrites GENERATED rows and keeps MANUAL ones, so a band an admin
corrected against the official schedule is never silently undone. CSV import
replaces a whole table and lands rows as MANUAL -- they came from the
authority, not from our inferred rule.

Any change to a table clears bandsVerifiedAt, because whatever was verified no
longer describes the table. Verification records who confirmed it and when.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

# Phase 9 — The staff portal

## Task 21: Authenticated payslip PDF route

**Files:**
- Create: `src/app/api/payslips/[id]/pdf/route.ts`

**Interfaces:**
- Consumes: `getSession`; `readUploadedFile` from `@/lib/storage`
- Produces: `GET` handler

Follows `src/app/api/invoices/[id]/pdf/route.ts` exactly, with one extra condition: staff may read only **finalized** payslips.

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { readUploadedFile } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { run: { select: { status: true } } },
  });
  if (!payslip || !payslip.pdfPath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "STAFF") {
    // Two conditions, both required: it must be their own payslip, and the run
    // must be issued. A draft is internal — an employee must never see a figure
    // that is still being reviewed.
    const isOwn = session.employeeId === payslip.employeeId;
    const isIssued = payslip.run.status === "FINALIZED";
    if (!isOwn || !isIssued) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (session.role !== "ADMIN") {
    // A VENDOR session has no business here at all.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await readUploadedFile(payslip.pdfPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${payslip.payslipNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

- [ ] **Step 2: Verify every authorization branch**

With a finalized payslip belonging to employee A:

| Request | Expected |
| --- | --- |
| No session | 401 |
| Admin | 200, PDF |
| Employee A | 200, PDF |
| Employee B | 403 |
| A vendor session | 403 |
| Employee A, draft run | 403 |
| Any session, unknown id | 404 |

Create a second employee to test the cross-employee case. Do not skip it — it is the check that stops one employee reading another's salary.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/payslips
git commit -m "$(cat <<'MSG'
feat(payroll): serve payslip PDFs through an authenticated route

Blob URLs are never exposed. Staff need both conditions: the payslip must be
theirs and the run must be finalized, so nobody sees a figure still under
review. A vendor session is rejected outright.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 22: Staff portal pages

**Files:**
- Create: `src/app/staff/layout.tsx`, `src/app/staff/page.tsx`, `src/app/staff/payslips/page.tsx`, `src/app/staff/profile/page.tsx`, `src/app/staff/profile/StaffProfileForm.tsx`

**Interfaces:**
- Consumes: `requireStaff`; `staffUpdateProfile`, `changeStaffPassword` from Task 14; `AppShell`, `PasswordChangeForm`, `StatCard`, `Badge`
- Produces: route components only

- [ ] **Step 1: `src/app/staff/layout.tsx`**

Mirrors `src/app/vendor/layout.tsx`:

```tsx
import { requireStaff } from "@/lib/currentUser";
import { AppShell, type NavItem } from "@/components/AppShell";
import { IconDashboard, IconDocument, IconUser } from "@/components/icons";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const employee = await requireStaff();

  const links: NavItem[] = [
    { href: "/staff", label: "Dashboard", icon: <IconDashboard className="shrink-0" />, exact: true },
    { href: "/staff/payslips", label: "Payslips", icon: <IconDocument className="shrink-0" /> },
    { href: "/staff/profile", label: "Profile", icon: <IconUser className="shrink-0" /> },
  ];

  return (
    <AppShell portalLabel="Staff Portal" navItems={links} userLabel={employee.fullName} userSubLabel={employee.designation}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 2: `/staff` — dashboard**

**Every query is scoped to the session's employee.** Never `findMany` without `employeeId`.

```ts
const employee = await requireStaff();
const latest = await prisma.payslip.findFirst({
  where: { employeeId: employee.id, run: { status: "FINALIZED" } },
  include: { run: true },
  orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
});
```

Title "Welcome back, {employee.fullName}", subtitle showing designation and department. Three `StatCard`s from `latest`: "Latest net pay", "Period", "Payment status". When `latest` is null, a `g6-card` reading "No payslips have been issued yet." Then, when `latest` exists, a `g6-card` with a `g6-btn g6-btn-primary` link to `/api/payslips/${latest.id}/pdf` (`target="_blank"`) reading "Download Latest Payslip".

Do **not** show the employee their statutory identifiers or bank details on the dashboard — those belong on the profile page behind a deliberate click.

- [ ] **Step 3: `/staff/payslips` — history**

```ts
const payslips = await prisma.payslip.findMany({
  where: { employeeId: employee.id, run: { status: "FINALIZED" } },
  include: { run: true },
  orderBy: [{ run: { year: "desc" } }, { run: { month: "desc" } }],
});
```

The `run: { status: "FINALIZED" }` filter is load-bearing: drafts are internal. It is enforced here *and* in the PDF route, deliberately, because losing it in one place should not expose a draft.

`g6-table` columns: **Payslip #** (`font-mono-g6`), **Period**, **Gross**, **Deductions**, **Net** (`font-mono-g6`, emphasised), **Payment** (Badge over `run.paymentStatus`), **PDF** (link when `pdfPath` is set, otherwise the muted text "Preparing"). Empty state `colSpan={7}` reading "No payslips yet."

- [ ] **Step 4: `/staff/profile`**

Mirrors `src/app/vendor/profile/page.tsx`. Three `g6-card` blocks:

1. **Employment details** — read-only: employee code, designation, department, hire date, and the statutory identifiers (NRIC, EPF, SOCSO, PCB numbers). Note: "Contact your administrator to correct any of these."
2. `<StaffProfileForm employee={employee} />` — editable contact, address and bank details on `staffUpdateProfile`
3. `<PasswordChangeForm action={changeStaffPassword} />` — the existing component, reused as-is

- [ ] **Step 5: Verify**

Signed in as an employee:
1. `/staff` shows the latest payslip and nothing belonging to anyone else.
2. `/staff/payslips` lists finalized payslips only — create a draft run and confirm it does not appear.
3. Download a PDF; confirm it is the employee's own.
4. Edit phone and bank details, confirm they persist and that statutory fields are not editable.
5. Change the password, sign out, sign in with the new one.
6. Navigate to `/admin` — confirm the redirect to `/login`.
7. Guess another employee's payslip URL — confirm 403.

- [ ] **Step 6: Typecheck, lint, commit**

```bash
npx tsc --noEmit && npm run lint
git add src/app/staff
git commit -m "$(cat <<'MSG'
feat(payroll): add the staff portal

Dashboard, payslip history and self-service profile, reusing AppShell and
PasswordChangeForm.

Every query is scoped by employeeId and filtered to finalized runs. Both
constraints are repeated in the PDF route rather than relying on one place:
losing the filter in a page should not expose a draft, and middleware is
defence in depth, not the authorization.

Statutory identifiers are read-only and off the dashboard -- they sit on the
profile page behind a deliberate click.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

# Phase 10 — Recording payment

## Task 23: Mark a run paid

**Files:**
- Create: `src/app/admin/payroll/[id]/MarkRunPaidForm.tsx`
- Modify: `src/app/admin/payroll/[id]/page.tsx`

**Interfaces:**
- Consumes: `markRunPaidAction` from Task 16
- Produces: `MarkRunPaidForm`

- [ ] **Step 1: `MarkRunPaidForm.tsx`**

`"use client"` on `markRunPaidAction`, following the open/closed inline pattern in `src/app/admin/vendors/[id]/MarkPaidForms.tsx` — read that file first.

Collapsed: a `g6-btn g6-btn-secondary g6-btn-sm` reading "Mark Run as Paid". Expanded: a `g6-panel p-4` with a hidden `runId`, a `paidAt` date input defaulting to today (`new Date().toISOString().slice(0, 10)`), an optional `paymentReference` text input (placeholder "Bank transfer reference"), a Confirm button and a Cancel button.

Unlike bills and invoices, there is no amount or transaction-fee field — the amount is the run's total net pay, already stored on the payslips, and re-entering it would create a second figure that could disagree.

- [ ] **Step 2: Wire it into the run page**

In `src/app/admin/payroll/[id]/page.tsx`, below the table:

```tsx
{run.status === "FINALIZED" && run.paymentStatus === "UNPAID" ? (
  <MarkRunPaidForm runId={run.id} />
) : null}

{run.paymentStatus === "PAID" ? (
  <div className="g6-panel p-4">
    <p className="text-[13px] font-semibold text-[#5ee8c0]">
      Paid on {formatDisplayDate(run.paidAt!)}
    </p>
    {run.paymentReference ? (
      <p className="mt-1 text-[12px] text-[#a09bb5]">Reference: {run.paymentReference}</p>
    ) : null}
  </div>
) : null}
```

`formatDisplayDate` comes from `@/lib/billingDates`.

- [ ] **Step 3: Verify**

1. On a finalized, unpaid run, confirm the button appears; on a draft run, confirm it does not.
2. Mark it paid, confirm the panel replaces the button and the list page's Payment badge flips.
3. Confirm `/staff/payslips` shows the payment status as paid for that period — `markRunPaidAction` revalidates `/staff/payslips` for exactly this reason.

- [ ] **Step 4: Full verification pass**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

All four must pass. `npm run build` matters here: it is the first check that every new page compiles under a production build, and it runs `prisma generate` first.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/payroll
git commit -m "$(cat <<'MSG'
feat(payroll): record payment against a finalized run

No amount or fee field, unlike bills and invoices: the amount is the run's
total net pay and is already stored on the payslips. Re-entering it would
create a second figure that could disagree with the payslips themselves.

Completes the payroll feature.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---
# Spec coverage

Checked after writing, section by section against `docs/superpowers/specs/2026-09-22-full-time-staff-payroll-design.md`.

| Spec section | Tasks |
| --- | --- |
| 3. Data model — all seven models, five enums, `User` changes | 6, 8 |
| 4. Calculation engine — order of operations, integer sen, proration, file layout | 1, 2, 3, 4, 5, 9 |
| 5. Settings and configurability — rates, band generation, admin ownership of bands | 19, 20 |
| 6. Flows — generate, review, finalize, back-dated increments, mark paid | 10, 13, 15, 16, 17, 18, 23 |
| 7. UI — admin routes, staff routes, API, actions, PDF, reuse, existing-code changes | 8, 11, 12, 14, 15, 17, 18, 19, 20, 21, 22, 23 |
| 8. Testing — golden fixture and every listed case | 1, 2, 3, 4, 5 |
| 9. Migration and rollout — additive migrations, band seed, build order | 6, 7 |
| 10. Security — private blobs, per-query scoping, drafts hidden, no cross-employee reads | 21, 22 |
| 11. Out of scope | not implemented; recorded in `docs/payroll-future-plans.md` |
| 12. Verification items — band reconciliation, EPF caveat, HRDF default | 7, 17, 19, 20 |

Nothing in the spec is unimplemented. One deliberate deviation: the settings and
band server actions live in their own files rather than in `src/actions/payroll.ts`
(see File Structure).

# Two things that must not be "fixed" during implementation

1. **The golden fixture's expected values.** If Task 3's reference test fails, the
   engine is wrong, not the test. Those thirteen figures come from the reference
   payslip and are the specification.
2. **`floorTo5Sen` flooring rather than rounding.** Rounding 91.875 to the nearest
   5 sen gives 91.90 and contradicts the reference. The direction is inferred from
   one data point and is on the section 12 reconciliation list — but it is not a
   bug to be tidied up mid-implementation.
