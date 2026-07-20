"use client";

import { createContractDeliverable, updateContractDeliverable } from "@/actions/admin";
import { TaskRowsEditor, type TaskRow } from "@/components/TaskRowsEditor";

export function NewDeliverableForm({ vendorId }: { vendorId: string }) {
  return (
    <TaskRowsEditor
      action={createContractDeliverable}
      hiddenFields={{ vendorId }}
      submitLabel="Create Invoice"
      pendingLabel="Creating invoice..."
    />
  );
}

export function EditDeliverableForm({
  vendorId,
  submissionId,
  initialRows,
  initialNotes,
}: {
  vendorId: string;
  submissionId: string;
  initialRows: TaskRow[];
  initialNotes: string;
}) {
  return (
    <TaskRowsEditor
      action={updateContractDeliverable}
      hiddenFields={{ vendorId, submissionId }}
      initialRows={initialRows}
      initialNotes={initialNotes}
      submitLabel="Save Changes"
      pendingLabel="Saving..."
    />
  );
}
