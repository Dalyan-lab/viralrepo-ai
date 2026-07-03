"use client";

// Radar IA — design "maquette" : bande déroulante des repos en explosion,
// filtres par catégorie (Toute l'IA, LLMs, Agents, RAG, Vision, Voix),
// période (Chaud / Mois / Année), cartes avec logo du dépôt, vélocité
// en barre rouge et détails (étoiles, forks, âge, langage).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame, Star, GitFork, Clock, RefreshCw, Zap, Radar as RadarIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import type { TrendingRepo } from "@/lib/github";

const CATEGORIES = [
  { id: "all", label: "Toute l'IA" },
  { id: "llm", label: "LLMs" },
  { id: "agents", label: "Agents" },
  { id: "rag", label: "RAG" },
  { id: "vision", label: "Vision" },
  { id: "voice", label: "Voix" },
] as const;

const PERIODS = [
  { id: "hot", label: "Chaud" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
] as const;

const BADGE_STYLES: Record<string, string> = {
  EXPLOSIF: "border border-red-500/60 bg-red-500/10 text-red-400",
  "EN FUSION": "border border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-400",
  "MONTÉE RAPIDE": "border border-cyan-500/60 bg-cyan-500/10 text-cyan-400",
  TENDANCE: "border border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
};

function ageDays(createdAt: string) {
  return Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
}

function fmtStars(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".0", "")}k` : `${n}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"github" | "demo">("github");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("hot");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trending?cat=${cat}&period=${period}`);
      const data = await res.json();
      setRepos(data.repos);
      setSource(data.source);
    } finally {
      setLoading(false);
    }
  }, [cat, period]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const openStudio = (repo: TrendingRepo) => {
    sessionStorage.setItem("vr-selected-repo", JSON.stringify(repo));
    router.push("/studio");
  };

  const maxVelocity = Math.max(1, ...repos.map((r) => r.velocity));
  const ticker = repos.slice(0, 12);

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      {/* ---- Bande déroulante des repos en explosion ---- */}
      {ticker.length > 0 && (
        <div className="marquee border-b border-[var(--border)] bg-black/40 py-2.5">
          <div className="marquee-track">
            {[...ticker, ...ticker].map((r, i) => (
              <button
                key={`${r.id}-${i}`}
                onClick={() => openStudio(r)}
                className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
              >
                <Flame size={13} className="text-red-500" />
                <span>{r.fullName}</span>
                <span className="font-bold text-red-400">{r.velocity} ★/j</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-5 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon animate-pulse-glow">
              <RadarIcon size={21} />
            </span>
            Radar IA <span className="neon-text">temps réel</span>
          </h1>
          {source === "demo" && (
            <p className="mt-2 text-xs text-yellow-400">
              Mode démo — API GitHub momentanément indisponible.
            </p>
          )}
        </motion.div>

        {/* ---- Barre de filtres ---- */}
        <div className="glass mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  cat === c.id
                    ? "btn-neon"
                    : "text-muted hover:text-[var(--fg)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="glass flex items-center rounded-xl p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    period === p.id
                      ? "bg-[var(--fg)] text-[var(--bg)]"
                      : "text-muted hover:text-[var(--fg)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              disabled={loading}
              aria-label="Actualiser"
              className="btn-neon grid h-10 w-10 place-items-center rounded-full disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ---- Cartes ---- */}
        {loading && repos.length === 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass h-80 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo, i) => (
              <motion.article
                key={`${cat}-${period}-${repo.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.4) }}
                className="glass neon-border group flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-1"
              >
                <div className="flex-1 p-5">
                  {/* En-tête : logo + propriétaire + badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {repo.ownerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={repo.ownerAvatar}
                          alt={repo.owner}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-[var(--border)]"
                        />
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl btn-neon font-display text-lg font-bold">
                          {repo.name[0]?.toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs text-muted">{repo.owner}</p>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate font-display text-lg font-bold hover:underline"
                          title={repo.fullName}
                        >
                          {repo.name}
                        </a>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-extrabold tracking-widest ${BADGE_STYLES[repo.badge]}`}
                    >
                      🔥 {repo.badge}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
                    {repo.description || "Pas de description."}
                  </p>

                  {/* Vélocité */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted">
                      <Zap size={14} className="text-red-500" /> Vélocité
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {repo.velocity.toLocaleString("fr-FR")}{" "}
                      <span className="text-sm text-red-400">★/j</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
                      style={{ width: `${Math.max(6, (repo.velocity / maxVelocity) * 100)}%` }}
                    />
                  </div>

                  {/* Détails : étoiles / forks / âge */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { icon: Star, label: "ÉTOILES", value: fmtStars(repo.stars) },
                      { icon: GitFork, label: "FORKS", value: fmtStars(repo.forks) },
                      { icon: Clock, label: "ÂGE", value: `${ageDays(repo.createdAt)}j` },
                    ].map((s) => (
                      <div key={s.label} className="glass rounded-xl px-2 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wider text-muted">
                          <s.icon size={11} /> {s.label}
                        </div>
                        <div className="mt-1 font-mono text-base font-bold">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {repo.language && (
                    <span className="mt-3 inline-block rounded-lg glass px-2.5 py-1 text-xs font-medium text-muted">
                      {repo.language}
                    </span>
                  )}
                </div>

                {/* Bouton pleine largeur */}
                <button
                  onClick={() => openStudio(repo)}
                  className="btn-neon flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
                >
                  <Zap size={15} /> Générer un script viral
                </button>
              </motion.article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
