import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">G6 Labs Asia — Vendor Registration</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Register as a Business or Individual vendor. Your account will be reviewed by our team before activation.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </main>
  );
}
