import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { vendorDisplayName } from "@/lib/invoice";
import { NewDeliverableForm } from "../../ContractDeliverableForm";

export default async function NewDeliverablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();
  if (vendor.accountType !== "CONTRACT_FREELANCER") {
    redirect(`/admin/vendors/${id}`);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Add Deliverable Entry — {vendorDisplayName(vendor)}</h1>
      <NewDeliverableForm vendorId={vendor.id} />
    </div>
  );
}
