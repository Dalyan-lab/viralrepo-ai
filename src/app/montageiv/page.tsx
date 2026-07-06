"use client";

// Accueil Montageiv : tableau de bord (consommation, créations, temps gagné),
// accès rapide aux modules et dernières créations.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Layers, Clock, Star, Loader2 } from "lucide-react";
import { MODULES } from "@/components/montageiv/modules";
import { Creation, CreationCard } from "@/components/montageiv/CreationCard";

export default function MontageivHome() {
  const [data, setData] = useState<any>(null);
  const [latest, setLatest] = useState<Creation[] | null>(null);

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([
      fetch("/api/montageiv/credits").then((r) => r.json()),
      fetch("/api/montageiv/creations").then((r) => r.json()),
    ]);
    setData(d);
    setLatest((c.creations ?? []).slice(0, 8));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold">
        Bienvenue dans <span className="neon-text">Montageiv IA</span>
      </motion.h1>
      <p className="mt-1 text-sm text-muted">
        Votre suite créative : générez images, vidéos, musiques, voix, avatars et textes — au même endroit.
      </p>

      {/* Statistiques */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Zap, label: "Crédits restants", value: data ? `${data.credits.remaining}/${data.credits.allowance}` : "…" },
          { icon: Layers, label: "Créations", value: data ? data.stats.total : "…" },
          { icon: Clock, label: "Temps économisé", value: data ? `~${Math.round(data.stats.timeSavedMin / 60)}h` : "…" },
          { icon: Star, label: "Favoris", value: data ? data.stats.favorites : "…" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass neon-border rounded-2xl p-4"
          >
            <s.icon size={17} className="text-neon-cyan" />
            <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Accès rapide aux modules */}
      <h2 className="mt-8 font-display font-semibold">Outils IA</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
          >
            <Link
              href={`/montageiv/outils/${m.id}`}
              className="glass neon-border group flex items-center gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl btn-neon transition-transform group-hover:scale-110">
                <m.icon size={18} />
              </span>
              <div className="min-w-0">
                <div className="font-semibold">{m.label}</div>
                <div className="truncate text-xs text-muted">{m.tagline}</div>
              </div>
              <span className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full glass px-2 py-0.5 text-[10px] text-muted">
                <Zap size={10} /> {m.cost}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Dernières créations */}
      <h2 className="mt-8 font-display font-semibold">Dernières créations</h2>
      {latest === null ? (
        <div className="mt-6 grid place-items-center">
          <Loader2 size={22} className="animate-spin text-neon-violet" />
        </div>
      ) : latest.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Aucune création pour l'instant — lancez votre premier outil ! ✨</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {latest.map((c) => (
            <CreationCard key={c.id} creation={c} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
