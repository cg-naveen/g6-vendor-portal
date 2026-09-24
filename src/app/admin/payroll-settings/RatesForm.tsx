"use client";

import { useActionState } from "react";
import { updateRatesAction, type FormState } from "@/actions/payrollSettings";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";
import { FormField } from "@/components/FormField";

const initialState: FormState = {};

type RatesFormProps = {
  epfEmployeeRate: string;
  epfEmployerRate: string;
  epfEmployerRateBelowThreshold: string;
  epfEmployerThreshold: string;
  socsoEmployeeRate: string;
  socsoEmployerRate: string;
  socsoWageCeiling: string;
  socsoBandWidth: string;
  eisEmployeeRate: string;
  eisEmployerRate: string;
  eisWageCeiling: string;
  eisBandWidth: string;
  hrdfEnabled: boolean;
  hrdfRate: string;
};

const bandNote =
  "These rates generate the band table rather than being applied to salary directly — 0.5% of 5,300 is 26.50, but the statutory figure is 26.25 because it derives from the band midpoint. Saving a rate here does not rebuild the table; use the SOCSO or EIS tab to regenerate.";

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="g6-card space-y-4 p-5">
      <div>
        <h2 className="text-base font-semibold text-[#ece9f5]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#8781a0]">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function RatesForm(props: RatesFormProps) {
  const [state, formAction, pending] = useActionState(updateRatesAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Payroll rates saved.</SuccessBanner> : null}

      <Section
        title="EPF / KWSP"
        note="The employer rate is the below threshold rate at or below the threshold amount, and the main rate above it. Statutory values are 13% at or below RM5,000 and 12% above."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Employee Rate (%)" name="epfEmployeeRate" type="number" min="0" defaultValue={props.epfEmployeeRate} error={errors.epfEmployeeRate} />
          <FormField label="Employer Rate (%)" name="epfEmployerRate" type="number" min="0" defaultValue={props.epfEmployerRate} error={errors.epfEmployerRate} />
          <FormField
            label="Employer Rate Below Threshold (%)"
            name="epfEmployerRateBelowThreshold"
            type="number"
            min="0"
            defaultValue={props.epfEmployerRateBelowThreshold}
            error={errors.epfEmployerRateBelowThreshold}
          />
          <FormField label="Employer Threshold (RM)" name="epfEmployerThreshold" type="number" min="0" defaultValue={props.epfEmployerThreshold} error={errors.epfEmployerThreshold} />
        </div>
      </Section>

      <Section title="SOCSO" note={bandNote}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Employee Rate (%)" name="socsoEmployeeRate" type="number" step="0.001" min="0" defaultValue={props.socsoEmployeeRate} error={errors.socsoEmployeeRate} />
          <FormField label="Employer Rate (%)" name="socsoEmployerRate" type="number" step="0.001" min="0" defaultValue={props.socsoEmployerRate} error={errors.socsoEmployerRate} />
          <FormField label="Wage Ceiling (RM)" name="socsoWageCeiling" type="number" min="0.01" defaultValue={props.socsoWageCeiling} error={errors.socsoWageCeiling} />
          <FormField label="Band Width (RM)" name="socsoBandWidth" type="number" min="0.01" defaultValue={props.socsoBandWidth} error={errors.socsoBandWidth} />
        </div>
      </Section>

      <Section title="EIS" note={bandNote}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Employee Rate (%)" name="eisEmployeeRate" type="number" step="0.001" min="0" defaultValue={props.eisEmployeeRate} error={errors.eisEmployeeRate} />
          <FormField label="Employer Rate (%)" name="eisEmployerRate" type="number" step="0.001" min="0" defaultValue={props.eisEmployerRate} error={errors.eisEmployerRate} />
          <FormField label="Wage Ceiling (RM)" name="eisWageCeiling" type="number" min="0.01" defaultValue={props.eisWageCeiling} error={errors.eisWageCeiling} />
          <FormField label="Band Width (RM)" name="eisBandWidth" type="number" min="0.01" defaultValue={props.eisBandWidth} error={errors.eisBandWidth} />
        </div>
      </Section>

      <Section title="HRDF" note="An employer-only levy. Enable only if the company is registered under the PSMB Act.">
        <label className="flex items-center gap-3 text-sm text-[#c4bfd5]">
          <input name="hrdfEnabled" type="checkbox" defaultChecked={props.hrdfEnabled} className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#7c5cff]" />
          Enable HRDF levy
        </label>
        <FormField label="HRDF Rate (%)" name="hrdfRate" type="number" min="0" defaultValue={props.hrdfRate} error={errors.hrdfRate} />
      </Section>

      <button type="submit" disabled={pending} className="g6-btn g6-btn-primary">
        {pending ? "Saving..." : "Save Payroll Rates"}
      </button>
    </form>
  );
}
