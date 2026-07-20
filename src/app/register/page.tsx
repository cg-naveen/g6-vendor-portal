import { AuthShell } from "@/components/AuthShell";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell
      title="G6 Labs Asia — Vendor Registration"
      subtitle="Register as a Business or Individual vendor. Your account will be reviewed by our team before activation."
      maxWidth="max-w-2xl"
    >
      <RegisterForm />
    </AuthShell>
  );
}
