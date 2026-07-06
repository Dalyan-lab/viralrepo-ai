"use client";

// Montageiv IA — plateforme dans la plateforme. Design « suite créative » :
// sidebar à icônes (groupe Outils), pastille Go Pro, chip compte, header avec
// crédits, et lecteur audio persistant en bas. Navigation SPA fluide.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home, Compass, Layers, Aperture, ArrowLeft, Menu, ArrowUpRight,
  Star, Users, Settings, ChevronRight,
} from "lucide-react";
import { MODULES } from "@/components/montageiv/modules";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { PlayerBar } from "@/components/montageiv/PlayerBar";

const PRIMARY = [
  { href: "/montageiv", label: "Accueil", icon: Home, exact: true },
  { href: "/montageiv/explorer", label: "Explorer", icon: Compass },
  { href: "/montageiv/templates", label: "Modèles", icon: Layers },
  { href: "/montageiv/historique", label: "Reshoot", icon: Aperture },
];

const SECONDARY = [
  { href: "/montageiv/favoris", label: "Favoris", icon: Star },
  { href: "/montageiv/communaute", label: "Communauté", icon: Users },
  { href: "/montageiv/parametres", label: "Paramètres", icon: Settings },
];

function CreditsGauge() {
  const pathname = usePathname();
  const [c, setC] = useState<{ used: number; allowance: number; remaining: number } | null>(null);

  useEffect(() => {
    const fetchIt = () =>
      fetch("/api/montageiv/credits")
        .then((r) => r.json())
        .then((d) => d.credits && setC(d.credits))
        .catch(() => {});
    fetchIt();
    window.addEventListener("focus", fetchIt);
    return () => window.removeEventListener("focus", fetchIt);
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

  const Row = ({ href, label, icon: Icon, exact }: any) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          active
            ? "border border-white/15 bg-white/[0.07] text-[var(--fg)] shadow-inner"
            : "border border-transparent text-muted hover:bg-white/5 hover:text-[var(--fg)]"
        }`}
      >
        <Icon size={18} className={active ? "neon-text" : ""} />
        {label}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <Link href="/montageiv" className="mb-5 flex items-center gap-2.5 px-2 font-display text-lg font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-xl btn-neon">
          <Aperture size={18} />
        </span>
        Montageiv<span className="neon-text">IA</span>
      </Link>

      <div className="space-y-1">
        {PRIMARY.map((l) => <Row key={l.href} {...l} />)}
      </div>

      <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
        Outils
      </p>
      <div className="space-y-1">
        {MODULES.map((m) => (
          <Row key={m.id} href={`/montageiv/outils/${m.id}`} label={m.label} icon={m.icon} />
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-4">
        {/* Secondaires compacts */}
        <div className="flex items-center justify-around border-t border-[var(--border)] pt-3 text-muted">
          {SECONDARY.map((l) => (
            <Link key={l.href} href={l.href} title={l.label} onClick={() => setOpen(false)}
              className={`grid h-8 w-8 place-items-center rounded-lg transition hover:bg-white/5 hover:text-[var(--fg)] ${pathname.startsWith(l.href) ? "text-[var(--fg)]" : ""}`}>
              <l.icon size={16} />
            </Link>
          ))}
          <Link href="/dashboard" title="Retour ViralRepo.AI"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-white/5 hover:text-[var(--fg)]">
            <ArrowLeft size={16} />
          </Link>
        </div>

        {/* Pastille Go Pro */}
        <Link href="/billing" className="flex items-center gap-1 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-1 text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110">
          <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold">
            Go Pro <ArrowUpRight size={14} />
          </span>
          <span className="rounded-full bg-white/25 px-3 py-1.5 text-xs font-semibold">55 % de réduction</span>
        </Link>

        {/* Chip compte */}
        <Link href="/montageiv/compte" className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-white/5">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-sm font-bold text-white">
            ⚡
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Mon compte</span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <FuturisticBackground />
      {/* Sidebar desktop */}
      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 overflow-y-auto border-r border-[var(--border)] lg:block">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="glass absolute left-0 top-0 h-full w-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-black/30 px-4 py-2.5 backdrop-blur-xl">
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
        <main className="flex-1 p-5 pb-28 lg:p-8 lg:pb-28">{children}</main>
      </div>

      <PlayerBar />
    </div>
  );
}
