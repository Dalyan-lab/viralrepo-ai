"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut, Menu, X, CreditCard, Gift } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Logo } from "./Logo";
import { StreakBadge } from "./StreakBadge";

const NAV_LINKS = [
  { href: "/dashboard", label: "Radar IA" },
  { href: "/studio", label: "Studio" },
  { href: "/production", label: "Production" },
  { href: "/avatar", label: "Avatar" },
  { href: "/thumbnails", label: "Miniatures" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Logo className="h-9 w-9" />
          <span>
            ViralRepo<span className="neon-text">.AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "neon-text"
                  : "text-muted hover:text-[var(--fg)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                pathname.startsWith("/admin") ? "neon-text" : "text-orange-400 hover:text-orange-300"
              }`}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && <StreakBadge />}
          <button
            onClick={toggle}
            aria-label="Changer de thème"
            className="grid h-9 w-9 place-items-center rounded-lg glass transition-transform hover:scale-105"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-muted">👋 {user.name}</span>
              <Link
                href="/referral"
                aria-label="Parrainage"
                title="Parrainez vos amis"
                className="grid h-9 w-9 place-items-center rounded-lg glass hover:scale-105"
              >
                <Gift size={15} />
              </Link>
              <Link
                href="/billing"
                aria-label="Facturation"
                title="Facturation & abonnement"
                className="grid h-9 w-9 place-items-center rounded-lg glass hover:scale-105"
              >
                <CreditCard size={15} />
              </Link>
              <button
                onClick={logout}
                className="grid h-9 w-9 place-items-center rounded-lg glass hover:scale-105"
                aria-label="Se déconnecter"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-[var(--fg)]">
                Connexion
              </Link>
              <Link href="/register" className="btn-neon rounded-lg px-4 py-2 text-sm font-semibold">
                Essai gratuit
              </Link>
            </div>
          )}

          <button
            className="grid h-9 w-9 place-items-center rounded-lg glass md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass border-t border-[var(--border)] px-5 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-[var(--fg)]"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-muted">
              Se déconnecter
            </button>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium">
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
