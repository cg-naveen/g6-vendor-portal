import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { TaskEntryForm } from "./TaskEntryForm";

export default async function NewTaskEntryPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "FREELANCER") {
    redirect("/vendor");
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Submit Delivered Tasks</h1>
      <TaskEntryForm />
    </div>
  );
}
