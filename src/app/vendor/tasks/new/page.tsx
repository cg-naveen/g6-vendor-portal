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
      <h1 className="g6-page-title mb-6">Submit Delivered Tasks</h1>
      <TaskEntryForm />
    </div>
  );
}
