import { AuthShell } from "@/components/AuthShell";
import { SuccessBanner } from "@/components/ErrorBanner";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;

  return (
    <AuthShell title="G6 Vendor Portal" subtitle="Sign in to your vendor or admin account">
      <div className="space-y-4">
        {reset === "success" ? <SuccessBanner>Your password has been reset. Sign in with your new password.</SuccessBanner> : null}
        <LoginForm />
      </div>
    </AuthShell>
  );
}
