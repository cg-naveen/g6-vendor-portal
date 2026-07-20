import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">G6 Vendor Portal</h1>
        <p className="mt-2 text-sm text-zinc-500">Sign in to your vendor or admin account</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
