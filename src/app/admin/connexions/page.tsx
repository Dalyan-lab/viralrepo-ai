"use client";

// Panneau de diagnostic des connexions (admin) : statut réel de chaque
// intégration (Gemini, GitHub, OAuth, Resend, D-ID, sécurité), avec test en
// direct et la liste des modèles Gemini réellement disponibles sur le compte.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PlugZap, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Circle,
  Copy, Check, ArrowLeft, ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

type Check = {
  id: string;
  label: string;
  role: string;
  configured: boolean;
  status: "live" | "demo" | "error" | "warn";
  detail: string;
  models?: string[];
};

const STATUS_UI = {
  live: { icon: CheckCircle2, cls: "text-emerald-400", chip: "bg-emerald-500/15 text-emerald-400", label: "🟢 RÉEL" },
  warn: { icon: AlertTriangle, cls: "text-yellow-400", chip: "bg-yellow-500/15 text-yellow-400", label: "🟡 À VÉRIFIER" },
  error: { icon: XCircle, cls: "text-red-400", chip: "bg-red-500/15 text-red-400", label: "🔴 ERREUR" },
  demo: { icon: Circle, cls: "text-slate-400", chip: "bg-slate-500/15 text-slate-400", label: "⚪ DÉMO" },
} as const;

export default function ConnexionsPage() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [openModels, setOpenModels] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const data = await res.json();
        setChecks(data.checks);
        setLiveCount(data.liveCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyModel = (m: string) => {
    navigator.clipboard.writeText(m);
    setCopied(m);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-[var(--fg)]">
          <ArrowLeft size={15} /> Retour à l'administration
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
              <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon animate-pulse-glow">
                <PlugZap size={21} />
              </span>
              Connexions <span className="neon-text">& API</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              État réel de chaque intégration. Collez vos clés dans le fichier{" "}
              <code className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-xs text-neon-cyan">.env</code>,
              redémarrez le serveur, puis actualisez ici.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-neon flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Tester les connexions
          </button>
        </div>

        {/* Compteur */}
        {checks && (
          <div className="glass neon-border mt-6 flex items-center gap-4 rounded-2xl px-5 py-4">
            <div className="font-display text-3xl font-bold neon-text">
              {liveCount}/{checks.length}
            </div>
            <div className="text-sm text-muted">
              intégrations en connexion réelle.{" "}
              {liveCount < 2
                ? "Objectif Phase 1 : activez Gemini + GitHub."
                : "Bravo, votre app est branchée en réel ! 🎉"}
            </div>
          </div>
        )}

        {/* Liste */}
        <div className="mt-6 space-y-3">
          {loading && !checks
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass h-24 animate-pulse rounded-2xl" />
              ))
            : checks?.map((c, i) => {
                const ui = STATUS_UI[c.status];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass neon-border rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <ui.icon size={20} className={`mt-0.5 shrink-0 ${ui.cls}`} />
                        <div>
                          <h3 className="font-display font-semibold">{c.label}</h3>
                          <p className="text-xs text-muted">{c.role}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${ui.chip}`}>
                        {ui.label}
                      </span>
                    </div>
                    <p className="mt-3 text-sm">{c.detail}</p>

                    {/* Liste des modèles Gemini disponibles */}
                    {c.models && c.models.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setOpenModels(openModels === c.id ? null : c.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold neon-text"
                        >
                          <ChevronDown
                            size={13}
                            className={`transition-transform ${openModels === c.id ? "rotate-180" : ""}`}
                          />
                          {c.models.length} modèles disponibles sur votre compte
                        </button>
                        {openModels === c.id && (
                          <div className="mt-2 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto">
                            {c.models.map((m) => (
                              <button
                                key={m}
                                onClick={() => copyModel(m)}
                                title="Copier — à coller dans GEMINI_MODEL"
                                className="glass flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:text-[var(--fg)]"
                              >
                                {copied === m ? <Check size={11} className="text-neon-lime" /> : <Copy size={11} />}
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
        </div>

        <div className="glass mt-6 rounded-2xl p-5 text-sm text-muted">
          <p className="font-semibold text-[var(--fg)]">💡 Rappel Phase 1</p>
          <p className="mt-2">
            1. Clé Gemini gratuite :{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="neon-text underline">
              aistudio.google.com/apikey
            </a>{" "}
            → collez-la dans <code className="font-mono text-neon-cyan">GEMINI_API_KEY</code>.
          </p>
          <p className="mt-1">
            2. Token GitHub :{" "}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="neon-text underline">
              github.com/settings/tokens
            </a>{" "}
            → collez-le dans <code className="font-mono text-neon-cyan">GITHUB_TOKEN</code>.
          </p>
          <p className="mt-1">
            3. Si Gemini indique « modèle introuvable », ouvrez la liste ci-dessus,
            copiez un modèle <em>pro</em> et collez-le dans{" "}
            <code className="font-mono text-neon-cyan">GEMINI_MODEL</code>.
          </p>
          <p className="mt-1">4. Redémarrez le serveur, puis « Tester les connexions ».</p>
        </div>

        {/* ---- Assistant Phase 2 : URLs de callback à enregistrer ---- */}
        <div className="glass neon-border mt-6 rounded-2xl p-5">
          <p className="font-display font-semibold">
            🔗 Phase 2 — URLs exactes à enregistrer
          </p>
          <p className="mt-1 text-sm text-muted">
            Lors de la création de vos identifiants OAuth, collez ces URLs
            <strong> à l'identique</strong> (c'est la cause n°1 d'échec). Cliquez pour copier.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              {
                label: "Google — URI de redirection autorisé",
                url: `${origin}/api/auth/oauth/google/callback`,
                where: "console.cloud.google.com → Identifiants → ID client OAuth (Web)",
              },
              {
                label: "GitHub — Authorization callback URL",
                url: `${origin}/api/auth/oauth/github/callback`,
                where: "github.com/settings/developers → New OAuth App",
              },
            ].map((r) => (
              <div key={r.url} className="glass rounded-xl p-3">
                <div className="text-xs font-semibold">{r.label}</div>
                <button
                  onClick={() => copyModel(r.url)}
                  className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-black/50"
                >
                  <span className="truncate text-neon-cyan">{r.url}</span>
                  {copied === r.url ? (
                    <Check size={13} className="shrink-0 text-neon-lime" />
                  ) : (
                    <Copy size={13} className="shrink-0 text-muted" />
                  )}
                </button>
                <div className="mt-1.5 text-[11px] text-muted">📍 {r.where}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 text-sm text-muted">
            <p className="font-semibold text-[var(--fg)]">Variables à remplir dans .env</p>
            <p>
              <code className="font-mono text-neon-cyan">GOOGLE_CLIENT_ID</code> +{" "}
              <code className="font-mono text-neon-cyan">GOOGLE_CLIENT_SECRET</code> ·{" "}
              <code className="font-mono text-neon-cyan">GITHUB_CLIENT_ID</code> +{" "}
              <code className="font-mono text-neon-cyan">GITHUB_CLIENT_SECRET</code>
            </p>
            <p className="mt-1">
              Emails :{" "}
              <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="neon-text underline">
                resend.com/api-keys
              </a>{" "}
              → <code className="font-mono text-neon-cyan">RESEND_API_KEY</code>. Le secret
              JWT est déjà sécurisé ✅.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
