"use client";

// Page de facturation (Paystack) : plan courant, offres en FCFA, paiement par
// carte ou Mobile Money, et gestion du retour de paiement.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Check, Loader2, Sparkles, X, Smartphone } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const PLAN_UI: Record<string, { label: string; color: string }> = {
  decouverte: { label: "Découverte (gratuit)", color: "glass" },
  createur: { label: "Créateur", color: "btn-neon" },
  studio: { label: "Studio", color: "btn-neon" },
};

function BillingInner() {
  const params = useSearchParams();
  const [plan, setPlan] = useState<string>("decouverte");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [paystackOn, setPaystackOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "info" | "err"; msg: string } | null>(null);

  const load = async () => {
    const d = await fetch("/api/billing/status").then((r) => r.json());
    setPlan(d.plan);
    setExpiresAt(d.expiresAt);
    setPaystackOn(d.paystackConfigured);
    setLoading(false);
  };

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    const canceled = params.get("canceled");
    (async () => {
      if (reference) {
        setBanner({ kind: "info", msg: "Vérification du paiement…" });
        const r = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        }).then((r) => r.json());
        setBanner(
          r.ok
            ? { kind: "ok", msg: "🎉 Paiement confirmé ! Votre accès premium est actif." }
            : { kind: "info", msg: "Paiement en cours de traitement…" }
        );
        // Nettoie l'URL pour éviter une re-vérification au rafraîchissement.
        window.history.replaceState({}, "", "/billing");
      } else if (canceled) {
        setBanner({ kind: "info", msg: "Paiement annulé — aucun montant prélevé." });
      }
      await load();
    })();
  }, [params]);

  const pay = async (p: "createur" | "studio") => {
    setBusy(true);
    try {
      const r = await fetch("/api/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      }).then((r) => r.json());
      if (r.url) window.location.href = r.url;
      else if (r.demo)
        setBanner({
          kind: "err",
          msg: "Paiement en mode démo (ajoutez PAYSTACK_SECRET_KEY dans .env pour activer).",
        });
      else setBanner({ kind: "err", msg: r.error || "Erreur." });
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
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${PLAN_UI[plan]?.color ?? "glass"}`}>
                {PLAN_UI[plan]?.label ?? plan}
              </span>
              {isPremium && expiresAt && (
                <span className="text-xs text-muted">
                  Accès actif jusqu'au{" "}
                  <span className="font-semibold">
                    {new Date(expiresAt).toLocaleDateString("fr-FR")}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Offres */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[
              { id: "createur" as const, name: "Créateur", price: "10 000 FCFA", feats: ["Scripts illimités", "Export MP4 HD", "Voix off IA", "Partage direct"] },
              { id: "studio" as const, name: "Studio", price: "25 000 FCFA", feats: ["Tout Créateur", "Vidéo IA (Runway)", "Avatar parlant", "File prioritaire"] },
            ].map((p) => (
              <div key={p.id} className="glass neon-border rounded-2xl p-6">
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <div className="mt-1 font-display text-2xl font-bold neon-text">
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
                  onClick={() => pay(p.id)}
                  disabled={busy}
                  className="btn-neon mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-50"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {plan === p.id ? "Renouveler" : `Choisir ${p.name}`}
                </button>
              </div>
            ))}
          </div>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted">
            <Smartphone size={13} className="text-neon-cyan" />
            Paiement par carte ou Mobile Money (Wave, Orange Money, MTN, Moov) via Paystack.
          </p>

          {!paystackOn && (
            <p className="mt-2 text-center text-xs text-muted">
              💡 Mode démo : ajoutez <code className="font-mono text-neon-cyan">PAYSTACK_SECRET_KEY</code> dans .env pour activer les paiements réels.
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
