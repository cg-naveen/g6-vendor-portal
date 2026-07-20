import Image from "next/image";

export function AuthShell({
  title,
  subtitle,
  maxWidth = "max-w-md",
  children,
}: {
  title: string;
  subtitle: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08060d] px-4 py-12">
      <div className="g6-glow-hero pointer-events-none absolute -top-64 -left-40 h-[620px] w-[620px] rounded-full" />
      <div
        className="pointer-events-none absolute top-1/3 -right-64 h-[560px] w-[560px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, #3a7bff 32%, transparent), transparent 65%)" }}
      />
      <div className={`relative z-10 w-full ${maxWidth}`}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/g6-logo-white.png" alt="G6 Labs" width={34} height={42} className="mb-5 h-10 w-auto" />
          <h1 className="text-xl font-bold text-[#ece9f5]">{title}</h1>
          <p className="mt-2 text-sm text-[#8781a0]">{subtitle}</p>
        </div>
        <div className="g6-card p-6 sm:p-7">{children}</div>
      </div>
    </main>
  );
}
