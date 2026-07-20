"use client";

import { submitTaskEntries } from "@/actions/tasks";
import { TaskRowsEditor } from "@/components/TaskRowsEditor";

export function TaskEntryForm() {
  return <TaskRowsEditor action={submitTaskEntries} submitLabel="Submit & Generate Invoice" pendingLabel="Generating invoice..." />;
}
