import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { EditDeliverableForm } from "../../../ContractDeliverableForm";
import type { TaskRow } from "@/components/TaskRowsEditor";

export default async function EditDeliverablePage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();
  if (vendor.accountType !== "CONTRACT_FREELANCER") {
    redirect(`/admin/vendors/${id}`);
  }

  const submission = await prisma.invoiceSubmission.findUnique({
    where: { id: submissionId },
    include: { lineItems: { orderBy: { date: "asc" } } },
  });
  if (!submission || submission.vendorId !== vendor.id) notFound();

  const initialRows: TaskRow[] = submission.lineItems.map((li) => ({
    date: li.date.toISOString().slice(0, 10),
    description: li.description,
    quantity: String(li.quantity),
    rate: String(li.rate),
  }));

  return (
    <div>
      <h1 className="g6-page-title mb-6">
        Edit Deliverable Entry — {vendorDisplayName(vendor)} ({submission.invoiceNumber})
      </h1>
      <EditDeliverableForm vendorId={vendor.id} submissionId={submission.id} initialRows={initialRows} initialNotes={submission.notes ?? ""} />
    </div>
  );
}
