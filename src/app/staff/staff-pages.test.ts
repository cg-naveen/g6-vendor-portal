import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const staffRoot = join(process.cwd(), "src/app/staff");

function readStaffPage(relativePath: string) {
  return readFileSync(join(staffRoot, relativePath), "utf8");
}

describe("staff portal pages", () => {
  it("provides the required staff routes", () => {
    expect(existsSync(join(staffRoot, "layout.tsx"))).toBe(true);
    expect(existsSync(join(staffRoot, "page.tsx"))).toBe(true);
    expect(existsSync(join(staffRoot, "payslips/page.tsx"))).toBe(true);
    expect(existsSync(join(staffRoot, "profile/page.tsx"))).toBe(true);
    expect(existsSync(join(staffRoot, "profile/StaffProfileForm.tsx"))).toBe(true);
  });

  it("keeps dashboard payslips employee-scoped and finalized-only", () => {
    if (!existsSync(join(staffRoot, "page.tsx"))) return;
    const source = readStaffPage("page.tsx");

    expect(source).toContain("employeeId: employee.id");
    expect(source).toContain('run: { status: "FINALIZED" }');
  });

  it("keeps payslip history employee-scoped and finalized-only", () => {
    if (!existsSync(join(staffRoot, "payslips/page.tsx"))) return;
    const source = readStaffPage("payslips/page.tsx");

    expect(source).toContain("employeeId: employee.id");
    expect(source).toContain('run: { status: "FINALIZED" }');
  });
});
