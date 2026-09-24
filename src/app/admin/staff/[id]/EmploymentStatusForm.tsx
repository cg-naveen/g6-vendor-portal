"use client";

import { useActionState, useState } from "react";
import { setEmploymentStatus, type FormState } from "@/actions/staff";
import { ErrorBanner, SuccessBanner } from "@/components/ErrorBanner";

type EmploymentStatus = "ACTIVE" | "RESIGNED" | "TERMINATED";

const initialState: FormState = {};

export function EmploymentStatusForm({
  employeeId,
  status: initialStatus,
  endedOn,
}: {
  employeeId: string;
  status: EmploymentStatus;
  endedOn: string | null;
}) {
  const [state, formAction, pending] = useActionState(setEmploymentStatus, initialState);
  const [status, setStatus] = useState<EmploymentStatus>(initialStatus);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      {state.error ? <ErrorBanner>{state.error}</ErrorBanner> : null}
      {state.success ? <SuccessBanner>Employment status updated.</SuccessBanner> : null}

      <label className="block">
        <span className="g6-label">Status</span>
        <select
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as EmploymentStatus)}
          className="g6-input g6-select"
        >
          <option value="ACTIVE">Active</option>
          <option value="RESIGNED">Resigned</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </label>

      {status !== "ACTIVE" ? (
        <label className="block">
          <span className="g6-label">End Date</span>
          <input name="endedOn" type="date" required defaultValue={endedOn ?? ""} className="g6-input" />
        </label>
      ) : null}

      <button type="submit" disabled={pending} className="g6-btn g6-btn-secondary">
        {pending ? "Updating..." : "Confirm Status"}
      </button>
    </form>
  );
}
