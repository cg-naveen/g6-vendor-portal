import Link from "next/link";
import { requireAdmin } from "@/lib/currentUser";
import { getPayrollSettings } from "@/lib/payrollSettings";
import { prisma } from "@/lib/prisma";
import { EmployerDetailsForm } from "./EmployerDetailsForm";
import { PayslipDesignForm } from "./PayslipDesignForm";
import { RatesForm } from "./RatesForm";

const tabs = [
  { id: "employer", label: "Employer" },
  { id: "rates", label: "Rates" },
  { id: "socso", label: "SOCSO Bands" },
  { id: "eis", label: "EIS Bands" },
  { id: "design", label: "Payslip Design" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default async function PayrollSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();

  const { tab: requestedTab } = await searchParams;
  const tab: Tab = tabs.some(({ id }) => id === requestedTab) ? (requestedTab as Tab) : "employer";
  const [settings, bands] = await Promise.all([
    getPayrollSettings(),
    prisma.statutoryBand.findMany({
      orderBy: [{ type: "asc" }, { wageFrom: "asc" }],
    }),
  ]);

  const socsoBandCount = bands.filter(({ type }) => type === "SOCSO").length;
  const eisBandCount = bands.filter(({ type }) => type === "EIS").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="g6-page-title mb-1">Payroll Settings</h1>
        <p className="g6-page-subtitle">Configure employer identifiers, statutory rates, contribution bands, and payslip presentation.</p>
      </div>

      <div className="g6-panel p-4 text-sm text-[#a09bb5]">
        Company name and address come from Billing Settings — the employing entity is the same one that appears as Bill To on vendor invoices.{" "}
        <Link href="/admin/settings" className="font-medium text-[#9d84ff] hover:text-[#cabfff]">
          Open Billing Settings
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 rounded-[11px] bg-black/30 p-1 text-sm">
        {tabs.map(({ id, label }) => (
          <Link
            key={id}
            href={id === "employer" ? "/admin/payroll-settings" : `/admin/payroll-settings?tab=${id}`}
            className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold ${
              tab === id ? "bg-white/[0.08] text-[#ece9f5]" : "text-[#8781a0]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "employer" ? (
        <div className="g6-card p-6">
          <EmployerDetailsForm
            employeeCodePrefix={settings.employeeCodePrefix}
            businessRegNumber={settings.businessRegNumber ?? ""}
            epfEmployerNumber={settings.epfEmployerNumber ?? ""}
            socsoEmployerNumber={settings.socsoEmployerNumber ?? ""}
            lhdnEmployerNumber={settings.lhdnEmployerNumber ?? ""}
          />
        </div>
      ) : null}

      {tab === "rates" ? (
        <RatesForm
          epfEmployeeRate={settings.epfEmployeeRate.toString()}
          epfEmployerRate={settings.epfEmployerRate.toString()}
          epfEmployerRateBelowThreshold={settings.epfEmployerRateBelowThreshold.toString()}
          epfEmployerThreshold={settings.epfEmployerThreshold.toString()}
          socsoEmployeeRate={settings.socsoEmployeeRate.toString()}
          socsoEmployerRate={settings.socsoEmployerRate.toString()}
          socsoWageCeiling={settings.socsoWageCeiling.toString()}
          socsoBandWidth={settings.socsoBandWidth.toString()}
          eisEmployeeRate={settings.eisEmployeeRate.toString()}
          eisEmployerRate={settings.eisEmployerRate.toString()}
          eisWageCeiling={settings.eisWageCeiling.toString()}
          eisBandWidth={settings.eisBandWidth.toString()}
          hrdfEnabled={settings.hrdfEnabled}
          hrdfRate={settings.hrdfRate.toString()}
        />
      ) : null}

      {tab === "socso" || tab === "eis" ? (
        <div className="g6-card p-6">
          <h2 className="text-base font-semibold text-[#ece9f5]">{tab === "socso" ? "SOCSO" : "EIS"} Contribution Bands</h2>
          <p className="mt-2 text-sm text-[#8781a0]">
            Band editing and regeneration will be added in Task 20.{" "}
            {tab === "socso" ? socsoBandCount : eisBandCount} existing bands are loaded.
          </p>
        </div>
      ) : null}

      {tab === "design" ? (
        <div className="g6-card p-6">
          <PayslipDesignForm
            payslipLogoUrl={settings.payslipLogoUrl}
            accentColor={settings.accentColor}
            showEmployerContributions={settings.showEmployerContributions}
            showHrdfColumn={settings.showHrdfColumn}
            showZakatColumn={settings.showZakatColumn}
            epfFootnote={settings.epfFootnote ?? ""}
            payslipFooterText={settings.payslipFooterText ?? ""}
          />
        </div>
      ) : null}
    </div>
  );
}
