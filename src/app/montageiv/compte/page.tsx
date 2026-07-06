"use client";

// Compte Montageiv : profil, plan, crédits et raccourcis de gestion.

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleUser, Zap, CreditCard, ArrowUpRight } from "lucide-react";

export default function ComptePage() {
  const [me, setMe] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetch("/api/billing/status").then((r) => r.json()).then(setBilling);
    fetch("/api/montageiv/credits").then((r) => r.json()).then((d) => setCredits(d.credits));
  }, []);

  const pct = credits ? Math.min(100, (credits.used / Math.max(1, credits.allowance)) * 100) : 0;

  return (
    <div className="max-w-xl">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <CircleUser size={22} className="text-neon-cyan" /> Compte
      </h1>

      <div className="glass neon-border mt-6 rounded-2xl p-6">
        <p className="font-display text-lg font-semibold">{me?.name ?? "…"}</p>
        <p className="text-sm text-muted">{me?.email ?? ""}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="btn-neon rounded-full px-3 py-1 text-xs font-bold">
            Plan {billing?.plan ?? "…"}
          </span>
          {billing?.expiresAt && (
            <span className="text-xs text-muted">
              actif jusqu'au {new Date(billing.expiresAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
      </div>

      <div className="glass neon-border mt-4 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display font-semibold">
            <Zap size={16} className="text-yellow-400" /> Crédits IA
          </span>
          <span className="text-sm font-bold">
            {credits ? `${credits.remaining}/${credits.allowance}` : "…"}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : "bg-gradient-to-r from-cyan-400 to-violet-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Allocation mensuelle selon votre plan : Découverte 50 · Créateur 500 · Studio 2000.
        </p>
        <Link
          href="/billing"
          className="btn-neon mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <CreditCard size={15} /> Gérer mon abonnement <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
