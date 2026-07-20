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
      <h1 className="g6-page-title mb-6">Upload New Bill</h1>
      <div className="g6-card p-6">
        <NewBillForm />
      </div>
    </div>
  );
}
