import { requireAdmin } from "@/lib/currentUser";
import { AddStaffForm } from "./AddStaffForm";

export default async function NewStaffPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="g6-page-title mb-1">Add Staff</h1>
      <p className="g6-page-subtitle mb-6">
        Creates a staff account with an admin-set initial password. The employee can change it after signing in.
      </p>
      <AddStaffForm />
    </div>
  );
}
