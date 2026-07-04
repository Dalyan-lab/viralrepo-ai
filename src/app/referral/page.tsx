"use client";

// Tableau de bord de parrainage : lien d'invitation, progression, récompenses,
// et liste des filleuls. Inspiré du modèle fourni, aux couleurs de la plateforme.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gift, Copy, Check, Users, Sparkles, Share2, Wand2, PartyPopper,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

type Data = {
  code: string;
  link: string;
  stats: { total: number; converted: number; pending: number; rewards: number };
  pendingReward: boolean;
  referrals: { name: string; email: string; status: string; createdAt: string }[];
};

const REWARD = 10000; // 1 mois Créateur offert par filleul converti (FCFA)
const GOAL = 100000; // objectif visuel : 100 000 FCFA (10 filleuls)

export default function ReferralPage() {
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"invite" | "info">("invite");

  useEffect(() => {
    fetch("/api/referral").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const copy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    if (!data) return;
    const text = `Crée des vidéos virales à partir des repos IA qui explosent avec ViralRepo.AI 🚀 Rejoins-moi :`;
    if (navigator.share) {
      navigator.share({ title: "ViralRepo.AI", text, url: data.link }).catch(() => {});
    } else {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + " " + data.link)}`,
        "_blank"
      );
    }
  };

  const earned = (data?.stats.rewards ?? 0) * REWARD; // 1 mois offert par filleul
  const progress = Math.min(100, (earned / GOAL) * 100);
  const fmt = (n: number) => n.toLocaleString("fr-FR");

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 font-display text-3xl font-bold"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon animate-pulse-glow">
            <Gift size={21} />
          </span>
          Parrainez vos <span className="neon-text">amis</span>
        </motion.h1>

        {/* Onglets */}
        <div className="glass mt-6 inline-flex rounded-xl p-1">
          {(["invite", "info"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === t ? "btn-neon" : "text-muted hover:text-[var(--fg)]"
              }`}
            >
              {t === "invite" ? "Parrainer" : "Mes parrainages"}
            </button>
          ))}
        </div>

        {!data ? (
          <div className="glass mt-6 h-40 animate-pulse rounded-2xl" />
        ) : tab === "invite" ? (
          <div className="mt-6 space-y-6">
            {/* Progression des gains */}
            <div className="glass neon-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted">Gagnez jusqu'à</p>
              <p className="font-display text-4xl font-bold neon-text">{fmt(GOAL)} FCFA</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 transition-all duration-700"
                  style={{ width: `${Math.max(3, progress)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>{fmt(earned)} FCFA gagnés</span>
                <span>{fmt(GOAL)} FCFA</span>
              </div>
            </div>

            {/* Comment ça marche */}
            <div className="glass neon-border rounded-2xl p-6">
              <h2 className="font-display font-semibold">Comment ça marche</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { icon: Wand2, t: "Partagez votre lien de parrainage avec des amis." },
                  { icon: Sparkles, t: "Ils s'inscrivent et obtiennent -20% sur leur 1er abonnement." },
                  { icon: Gift, t: "Vous gagnez 1 mois offert (10 000 FCFA) dès leur premier abonnement." },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg btn-neon">
                      <s.icon size={15} />
                    </span>
                    <p className="pt-1 text-muted">{s.t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lien d'invitation */}
            <div className="glass neon-border rounded-2xl p-6">
              <h2 className="font-display font-semibold">Votre lien d'invitation</h2>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="flex-1 truncate rounded-xl glass px-4 py-3 font-mono text-sm text-neon-cyan">
                  {data.link}
                </div>
                <button
                  onClick={copy}
                  className="btn-neon flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
              <button
                onClick={share}
                className="glass neon-border mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold hover:scale-[1.01]"
              >
                <Share2 size={15} /> Partager mon lien
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass neon-border rounded-2xl p-5">
                <Gift size={18} className="text-neon-cyan" />
                <div className="mt-2 font-display text-3xl font-bold neon-text">
                  {data.stats.rewards}
                </div>
                <div className="text-sm text-muted">Récompenses gagnées</div>
              </div>
              <div className="glass neon-border rounded-2xl p-5">
                <Users size={18} className="text-neon-violet" />
                <div className="mt-2 font-display text-3xl font-bold neon-text">
                  {data.stats.total}
                </div>
                <div className="text-sm text-muted">Total des parrainages</div>
              </div>
            </div>

            {data.pendingReward && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <PartyPopper size={16} /> Vous avez 1 mois offert en attente — il
                s'appliquera automatiquement à votre prochain abonnement !
              </div>
            )}

            {/* Liste */}
            <div className="glass neon-border rounded-2xl p-5">
              <h2 className="font-display font-semibold">Vos filleuls</h2>
              {data.referrals.length === 0 ? (
                <p className="mt-4 text-center text-sm text-muted">
                  Pas encore de parrainages. Partagez votre lien pour commencer ! 🎁
                </p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted">
                      <th className="pb-2">Filleul</th>
                      <th className="pb-2">Statut</th>
                      <th className="pb-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="py-2.5">
                          <div className="font-semibold">{r.name}</div>
                          <div className="text-xs text-muted">{r.email}</div>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              r.status === "converted"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-yellow-500/15 text-yellow-400"
                            }`}
                          >
                            {r.status === "converted" ? "ABONNÉ ✓" : "INSCRIT"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-xs text-muted">
                          {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <p className="text-center text-xs text-muted">
              * Le filleul doit souscrire à un forfait payant pour déclencher votre récompense.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/dashboard" className="neon-text font-semibold">← Retour au radar</Link>
        </p>
      </main>
    </>
  );
}
