import { redirect } from "next/navigation";
import { requireVendor } from "@/lib/currentUser";
import { NewBillForm } from "./NewBillForm";

export default async function NewBillPage() {
  const vendor = await requireVendor();
  if (vendor.status !== "APPROVED" || vendor.accountType !== "BUSINESS") {
    redirect("/vendor");
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Upload New Bill</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <NewBillForm />
      </div>
    </div>
  );
}
