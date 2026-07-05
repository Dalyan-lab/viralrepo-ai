"use client";

// Widget de série d'engagement (dashboard) : affiche la série, la vue
// hebdomadaire et un message. Si l'utilisateur n'est pas encore actif
// aujourd'hui, une modale « Sauvez votre série ! » l'invite à la maintenir.
// Les paliers (3/7/14/30 jours) offrent des jours d'accès premium.

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Check, Trophy, Gift, X } from "lucide-react";
import type { StreakState } from "@/lib/streak";

function WeekRow({ week }: { week: StreakState["week"] }) {
  return (
    <div className="flex justify-center gap-2">
      {week.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-1.5">
          <span className={`text-[10px] font-semibold ${d.today ? "neon-text" : "text-muted"}`}>
            {d.label}
          </span>
          <span
            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
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
  );
}

export function StreakWidget() {
  const [data, setData] = useState<StreakState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<{ milestone: number; bonusDays: number } | null>(null);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => {
        if (!d.week) return;
        setData(d);
        if (!d.activeToday) setShowModal(true);
      })
      .catch(() => {});
  }, []);

  const saveStreak = useCallback(async () => {
    setSaving(true);
    try {
      const d = await fetch("/api/streak", { method: "POST" }).then((r) => r.json());
      if (d.week) {
        setData(d);
        if (d.reward) setReward(d.reward);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }, []);

  if (!data) return null;

  const encouragement = data.activeToday
    ? data.streak <= 1
      ? "Série lancée ! Revenez demain pour la faire grandir. 🔥"
      : `Bravo, série de ${data.streak} jours maintenue ! Ne la lâchez pas.`
    : "Cliquez pour maintenir votre série du jour ! 🔥";

  return (
    <>
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
                <Trophy size={12} className="text-yellow-400" /> Record : {data.longestStreak} jour
                {data.longestStreak > 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <WeekRow week={data.week} />
        </div>

        {reward && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
            <Gift size={15} /> 🎉 Palier {reward.milestone} jours atteint : +{reward.bonusDays} jour
            {reward.bonusDays > 1 ? "s" : ""} d'accès premium offert{reward.bonusDays > 1 ? "s" : ""} !
          </div>
        )}

        <p className="mt-4 text-sm text-muted">{encouragement}</p>
      </motion.div>

      {/* ---- Modale « Sauvez votre série » ---- */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 px-5 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass neon-border relative w-full max-w-md rounded-3xl p-7 text-center"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg glass text-muted hover:text-[var(--fg)]"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>

              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame size={30} className="text-white" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold">Sauvez votre série !</h2>
              <p className="mt-1 text-sm text-muted">Ne perdez pas votre progression !</p>

              <div className="my-6">
                <WeekRow week={data.week} />
              </div>

              <p className="text-sm text-muted">
                {data.streak > 0
                  ? `Votre série de ${data.streak} jour${data.streak > 1 ? "s" : ""} vous attend — continuez à construire.`
                  : "Lancez votre série aujourd'hui et gagnez des jours premium aux paliers 3, 7, 14 et 30 jours."}
              </p>

              <button
                onClick={saveStreak}
                disabled={saving}
                className="btn-neon mt-6 w-full rounded-xl py-3.5 font-semibold disabled:opacity-60"
              >
                {saving ? "…" : "Continuer ma série 🔥"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
