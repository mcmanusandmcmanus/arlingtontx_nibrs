"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/auth-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/auth/login", label: "Login" },
];

export function SiteHeader() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-10 w-10 rounded-full bg-brand-500/20 text-brand-200 grid place-items-center font-semibold">
            AP
          </span>
          Arlington Data Ops
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm uppercase tracking-wide ${
                pathname === link.href ? "text-brand-200" : "text-slate-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {profile ? (
            <button
              onClick={logout}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-white/30"
            >
              Logout ({profile.user?.first_name || profile.user?.username})
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-400"
            >
              Officer Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
