import { notFound, redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { updateTaskEntries } from "@/actions/tasks";
import { TaskRowsEditor, type TaskRow } from "@/components/TaskRowsEditor";

export default async function EditTaskEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const vendor = await requireVendor();
  const { id } = await params;

  const submission = await prisma.invoiceSubmission.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { date: "asc" } } },
  });
  if (!submission || submission.vendorId !== vendor.id) notFound();
  if (submission.source !== "VENDOR" || submission.paymentStatus !== "UNPAID") {
    redirect("/vendor/invoices");
  }

  const initialRows: TaskRow[] = submission.lineItems.map((li) => ({
    date: li.date.toISOString().slice(0, 10),
    description: li.description,
    quantity: String(li.quantity),
    rate: String(li.rate),
  }));

  return (
    <div>
      <h1 className="g6-page-title mb-6">Edit Invoice — {submission.invoiceNumber}</h1>
      <TaskRowsEditor
        action={updateTaskEntries}
        hiddenFields={{ submissionId: submission.id }}
        initialRows={initialRows}
        initialNotes={submission.notes ?? ""}
        submitLabel="Save Changes"
        pendingLabel="Saving..."
      />
    </div>
  );
}
