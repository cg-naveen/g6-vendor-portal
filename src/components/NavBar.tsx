import Link from "next/link";
import { logoutUser } from "@/actions/auth";

export function NavBar({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-zinc-900">{title}</span>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-zinc-600 hover:text-indigo-600">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={logoutUser}>
          <button type="submit" className="text-sm text-zinc-500 hover:text-red-600">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
