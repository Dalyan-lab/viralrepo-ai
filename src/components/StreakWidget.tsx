"use client";

// Widget de série d'engagement (dashboard) : pingue l'activité du jour au
// chargement, affiche la série en cours, la vue hebdomadaire et un message
// d'encouragement — inspiré du modèle « Sauvez votre série ».

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Check, Trophy } from "lucide-react";
import type { StreakState } from "@/lib/streak";

export function StreakWidget() {
  const [data, setData] = useState<StreakState | null>(null);

  useEffect(() => {
    // POST = enregistre l'activité du jour + renvoie la série à jour.
    fetch("/api/streak", { method: "POST" })
      .then((r) => r.json())
      .then((d) => d.week && setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const encouragement = data.activeToday
    ? data.streak <= 1
      ? "Série lancée ! Revenez demain pour la faire grandir. 🔥"
      : `Bravo, série de ${data.streak} jours maintenue ! Ne la lâchez pas.`
    : "Générez un script aujourd'hui pour démarrer votre série ! 🔥";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border mb-8 rounded-2xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Flame size={24} className="text-white" />
          </span>
          <div>
            <div className="font-display text-2xl font-bold">
              {data.streak}{" "}
              <span className="text-base font-medium text-muted">
                jour{data.streak > 1 ? "s" : ""} de série
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Trophy size={12} className="text-yellow-400" /> Record : {data.longestStreak} jour{data.longestStreak > 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Vue hebdomadaire */}
        <div className="flex gap-2">
          {data.week.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[10px] font-semibold ${
                  d.today ? "neon-text" : "text-muted"
                }`}
              >
                {d.label}
              </span>
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-colors ${
                  d.active
                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                    : d.today
                      ? "border-2 border-dashed border-neon-violet text-muted"
                      : "border border-[var(--border)] text-muted/50"
                }`}
              >
                {d.active ? <Check size={14} /> : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">{encouragement}</p>
    </motion.div>
  );
}
