"use client";

// Page de facturation : plan courant, gestion de l'abonnement (portail Stripe),
// et gestion des retours de Checkout (succès / annulation).

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Check, Loader2, Sparkles, Settings, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const PLAN_UI: Record<string, { label: string; color: string }> = {
  decouverte: { label: "Découverte (gratuit)", color: "glass" },
  createur: { label: "Créateur — 19€/mois", color: "btn-neon" },
  studio: { label: "Studio — 49€/mois", color: "btn-neon" },
};

function BillingInner() {
  const params = useSearchParams();
  const [plan, setPlan] = useState<string>("decouverte");
  const [status, setStatus] = useState<string | null>(null);
  const [hasCustomer, setHasCustomer] = useState(false);
  const [stripeOn, setStripeOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "info" | "err"; msg: string } | null>(null);

  const load = async () => {
    const d = await fetch("/api/billing/status").then((r) => r.json());
    setPlan(d.plan);
    setStatus(d.status);
    setHasCustomer(d.hasCustomer);
    setStripeOn(d.stripeConfigured);
    setLoading(false);
  };

  useEffect(() => {
    // Retour de Checkout : confirme l'activation (filet sans webhook)
    const sid = params.get("session_id");
    const canceled = params.get("canceled");
    (async () => {
      if (sid) {
        setBanner({ kind: "info", msg: "Confirmation du paiement…" });
        const r = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        }).then((r) => r.json());
        setBanner(
          r.ok
            ? { kind: "ok", msg: "🎉 Abonnement activé ! Bienvenue dans le plan premium." }
            : { kind: "info", msg: "Paiement en cours de traitement…" }
        );
      } else if (canceled) {
        setBanner({ kind: "info", msg: "Paiement annulé — aucun montant prélevé." });
      }
      await load();
    })();
  }, [params]);

  const upgrade = async (p: "createur" | "studio") => {
    setBusy(true);
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      }).then((r) => r.json());
      if (r.url) window.location.href = r.url;
      else if (r.demo)
        setBanner({
          kind: "err",
          msg: "Stripe n'est pas encore configuré (ajoutez STRIPE_SECRET_KEY dans .env).",
        });
      else setBanner({ kind: "err", msg: r.error || "Erreur." });
    } finally {
      setBusy(false);
    }
  };

  const manage = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" }).then((r) => r.json());
      if (r.url) window.location.href = r.url;
      else setBanner({ kind: "err", msg: r.error || "Portail indisponible." });
    } finally {
      setBusy(false);
    }
  };

  const isPremium = plan === "createur" || plan === "studio";

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 font-display text-3xl font-bold"
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon">
          <CreditCard size={21} />
        </span>
        Facturation & <span className="neon-text">abonnement</span>
      </motion.h1>

      {banner && (
        <div
          className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "bg-emerald-500/10 text-emerald-400"
              : banner.kind === "err"
                ? "bg-red-500/10 text-red-400"
                : "bg-cyan-500/10 text-cyan-300"
          }`}
        >
          {banner.kind === "ok" ? <Check size={15} /> : banner.kind === "err" ? <X size={15} /> : <Loader2 size={15} />}
          {banner.msg}
        </div>
      )}

      {loading ? (
        <div className="mt-10 grid place-items-center">
          <Loader2 size={26} className="animate-spin text-neon-violet" />
        </div>
      ) : (
        <>
          {/* Plan courant */}
          <div className="glass neon-border mt-6 rounded-2xl p-6">
            <div className="text-sm text-muted">Votre plan actuel</div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-bold ${PLAN_UI[plan]?.color ?? "glass"}`}
              >
                {PLAN_UI[plan]?.label ?? plan}
              </span>
              {status && (
                <span className="text-xs text-muted">
                  Statut : <span className="font-semibold">{status}</span>
                </span>
              )}
            </div>
            {isPremium && hasCustomer && (
              <button
                onClick={manage}
                disabled={busy}
                className="glass neon-border mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold hover:scale-[1.02] disabled:opacity-50"
              >
                <Settings size={15} /> Gérer / annuler mon abonnement
              </button>
            )}
          </div>

          {/* Offres */}
          {!isPremium && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[
                { id: "createur" as const, name: "Créateur", price: "19€", feats: ["Scripts illimités", "Export MP4 HD", "Voix off IA", "Partage direct"] },
                { id: "studio" as const, name: "Studio", price: "49€", feats: ["Tout Créateur", "Vidéo IA (Runway)", "Avatar parlant", "File prioritaire"] },
              ].map((p) => (
                <div key={p.id} className="glass neon-border rounded-2xl p-6">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  <div className="mt-1 font-display text-3xl font-bold neon-text">
                    {p.price}<span className="text-sm text-muted"> /mois</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={15} className="mt-0.5 shrink-0 text-neon-lime" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => upgrade(p.id)}
                    disabled={busy}
                    className="btn-neon mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    Choisir {p.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!stripeOn && (
            <p className="mt-5 text-center text-xs text-muted">
              💡 Paiements en mode démo : ajoutez <code className="font-mono text-neon-cyan">STRIPE_SECRET_KEY</code> dans .env pour activer la facturation réelle.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/dashboard" className="neon-text font-semibold">← Retour au radar</Link>
          </p>
        </>
      )}
    </main>
  );
}

export default function BillingPage() {
  return (
    <>
      <FuturisticBackground />
      <Navbar />
      <Suspense fallback={null}>
        <BillingInner />
      </Suspense>
    </>
  );
}
