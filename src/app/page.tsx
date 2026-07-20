import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08060d] px-4 text-center">
      <div className="g6-glow-hero pointer-events-none absolute -top-64 -left-40 h-[620px] w-[620px] rounded-full" />
      <div
        className="pointer-events-none absolute top-1/3 -right-64 h-[560px] w-[560px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, #3a7bff 32%, transparent), transparent 65%)" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <Image src="/g6-logo-white.png" alt="G6 Labs" width={44} height={54} className="mb-8 h-14 w-auto" />
        <div className="g6-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7c5cff] shadow-[0_0_10px_#7c5cff]" />
          G6 LABS ASIA
        </div>
        <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-[#ece9f5] sm:text-5xl">Vendor Portal</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#a09bb5]">
          Register as a vendor to submit invoices and get paid, or sign in to your existing account.
        </p>
        <div className="mt-9 flex gap-3">
          <Link href="/register" className="g6-btn g6-btn-primary">
            Register as Vendor
          </Link>
          <Link href="/login" className="g6-btn g6-btn-secondary">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
