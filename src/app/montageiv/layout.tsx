"use client";

// Montageiv IA — plateforme dans la plateforme : sidebar permanente,
// header avec crédits, navigation SPA fluide entre les modules.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, Compass, FolderOpen, Star, History, Users, LayoutTemplate,
  Settings, CircleUser, ArrowLeft, Menu, Clapperboard,
} from "lucide-react";
import { MODULES } from "@/components/montageiv/modules";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const NAV = [
  { href: "/montageiv", label: "Accueil", icon: Home, exact: true },
  { href: "/montageiv/explorer", label: "Explorer", icon: Compass },
  { href: "/montageiv/bibliotheque", label: "Bibliothèque", icon: FolderOpen },
  { href: "/montageiv/favoris", label: "Favoris", icon: Star },
  { href: "/montageiv/historique", label: "Historique", icon: History },
  { href: "/montageiv/communaute", label: "Communauté", icon: Users },
  { href: "/montageiv/templates", label: "Templates", icon: LayoutTemplate },
];

const BOTTOM = [
  { href: "/montageiv/parametres", label: "Paramètres", icon: Settings },
  { href: "/montageiv/compte", label: "Compte", icon: CircleUser },
];

function CreditsGauge() {
  const pathname = usePathname();
  const [c, setC] = useState<{ used: number; allowance: number; remaining: number } | null>(null);

  useEffect(() => {
    fetch("/api/montageiv/credits")
      .then((r) => r.json())
      .then((d) => d.credits && setC(d.credits))
      .catch(() => {});
  }, [pathname]);

  if (!c) return null;
  const pct = Math.min(100, (c.used / Math.max(1, c.allowance)) * 100);
  return (
    <Link href="/montageiv/compte" className="glass flex items-center gap-2.5 rounded-xl px-3 py-1.5" title="Crédits IA">
      <span className="text-sm">⚡</span>
      <div className="w-24">
        <div className="flex justify-between text-[10px] text-muted">
          <span className="font-bold text-[var(--fg)]">{c.remaining}</span>
          <span>/{c.allowance}</span>
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : "bg-gradient-to-r from-cyan-400 to-violet-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function MontageivLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLink = ({ href, label, icon: Icon, exact }: any) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "btn-neon" : "text-muted hover:bg-white/5 hover:text-[var(--fg)]"
        }`}
      >
        <Icon size={17} />
        {label}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-4">
      <Link href="/montageiv" className="mb-4 flex items-center gap-2.5 px-2 font-display text-lg font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-xl btn-neon">
          <Clapperboard size={18} />
        </span>
        Montageiv<span className="neon-text">IA</span>
      </Link>

      {NAV.map((l) => (
        <NavLink key={l.href} {...l} />
      ))}

      <p className="mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-muted">
        Outils IA
      </p>
      {MODULES.map((m) => (
        <NavLink key={m.id} href={`/montageiv/outils/${m.id}`} label={m.label} icon={m.icon} />
      ))}

      <div className="mt-auto space-y-1 border-t border-[var(--border)] pt-3">
        {BOTTOM.map((l) => (
          <NavLink key={l.href} {...l} />
        ))}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-[var(--fg)]"
        >
          <ArrowLeft size={17} /> Retour ViralRepo.AI
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <FuturisticBackground />
      {/* Sidebar desktop */}
      <aside className="glass sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-[var(--border)] lg:block">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="glass absolute left-0 top-0 h-full w-64 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg glass lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menu"
          >
            <Menu size={17} />
          </button>
          <div className="hidden text-sm text-muted lg:block">
            Suite créative IA — image, vidéo, musique, voix, avatar, rédaction
          </div>
          <CreditsGauge />
        </header>
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
