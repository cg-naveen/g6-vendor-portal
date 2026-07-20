import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-zinc-900">G6 Labs Asia — Vendor Portal</h1>
      <p className="mt-3 max-w-md text-zinc-600">
        Register as a vendor to submit invoices and get paid, or sign in to your existing account.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/register" className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Register as Vendor
        </Link>
        <Link href="/login" className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          Sign In
        </Link>
      </div>
    </main>
  );
}
