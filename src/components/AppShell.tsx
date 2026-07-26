"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import { IconLogout } from "@/components/icons";
import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

export function AppShell({
  portalLabel,
  navItems,
  userLabel,
  userSubLabel,
  children,
}: {
  portalLabel: string;
  navItems: NavItem[];
  userLabel: string;
  userSubLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[#08060d]">
      <div className="g6-glow-hero pointer-events-none fixed -top-64 -left-40 z-0 h-[620px] w-[620px] rounded-full" />
      <div
        className="pointer-events-none fixed top-1/3 -right-64 z-0 h-[560px] w-[560px] rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, #3a7bff 32%, transparent), transparent 65%)" }}
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0a15] px-4 py-6">
          <div className="mb-7 flex shrink-0 items-center gap-3 px-2">
            <Image src="/g6-logo-white.png" alt="G6 Labs" width={26} height={32} className="h-8 w-auto" />
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-bold tracking-tight text-[#ece9f5]">{portalLabel}</span>
              <span className="text-[10px] font-medium text-[#8781a0]">G6 Labs Asia</span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href} className={`g6-nav-link ${isActive ? "g6-nav-link-active" : ""}`}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 shrink-0 border-t border-white/[0.06] pt-4">
            <div className="mb-3 px-2">
              <div className="truncate text-[13px] font-semibold text-[#ece9f5]">{userLabel}</div>
              <div className="truncate text-[11px] text-[#8781a0]">{userSubLabel}</div>
            </div>
            <form action={logoutUser}>
              <button type="submit" className="g6-nav-link w-full">
                <IconLogout className="shrink-0" />
                Log out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
