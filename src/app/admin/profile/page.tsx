import { requireAdmin } from "@/lib/currentUser";
import { changeAdminPassword } from "@/actions/profile";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";

export default async function AdminProfilePage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="g6-page-title">Admin Profile</h1>
        <p className="g6-page-subtitle mt-1">{admin.email}</p>
      </div>

      <div className="g6-card p-6">
        <h2 className="g6-section-label mb-4">Change Password</h2>
        <PasswordChangeForm action={changeAdminPassword} />
      </div>
    </div>
  );
}
