"use client";

// Avatar parlant (lip-sync D-ID) : le job part en file d'attente,
// l'interface se met à jour toute seule (polling + webhook côté serveur)
// et une notification prévient l'utilisateur — jamais bloqué.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  UserSquare2, Loader2, CheckCircle2, XCircle, Clock, Bell, Sparkles, Upload,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

type Job = {
  id: string;
  scriptText: string;
  avatarUrl: string;
  status: "queued" | "processing" | "done" | "error";
  resultUrl?: string | null;
  error?: string | null;
  createdAt: string;
};

// Avatars préréglés en SVG intégré : affichage garanti, même hors-ligne.
// (Pour un rendu D-ID réel, importez une photo de visage hébergée publiquement.)
function svgAvatar(emoji: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/><text x="64" y="82" font-size="56" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PRESET_AVATARS = [
  { name: "Nova", url: svgAvatar("🧑‍🚀", "#0ea5e9", "#8b5cf6") },
  { name: "Kai", url: svgAvatar("🤖", "#8b5cf6", "#d946ef") },
  { name: "Léa", url: svgAvatar("👩‍💻", "#f97316", "#ef4444") },
];

const STATUS_UI: Record<Job["status"], { label: string; cls: string; icon: any }> = {
  queued: { label: "En file d'attente", cls: "text-yellow-400", icon: Clock },
  processing: { label: "Animation en cours…", cls: "text-cyan-400", icon: Loader2 },
  done: { label: "Prêt à publier !", cls: "text-emerald-400", icon: CheckCircle2 },
  error: { label: "Erreur", cls: "text-red-400", icon: XCircle },
};

export default function AvatarPage() {
  const [scriptText, setScriptText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = sessionStorage.getItem("vr-avatar-script");
    if (saved) setScriptText(saved);
    load();
  }, []);

  const load = async () => {
    const res = await fetch("/api/avatar");
    if (!res.ok) return;
    const data = await res.json();
    setDemoMode(data.demoMode);
    setJobs((prev) => {
      // Notification quand un job passe à "done"
      for (const j of data.jobs as Job[]) {
        const old = prev.find((p) => p.id === j.id);
        if (j.status === "done" && old && old.status !== "done" && !notified.current.has(j.id)) {
          notified.current.add(j.id);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🎬 ViralRepo.AI", {
              body: "Votre avatar parlant est prêt à publier !",
            });
          }
        }
      }
      return data.jobs;
    });
  };

  // Polling tant qu'un job est actif
  useEffect(() => {
    const active = jobs.some((j) => j.status === "queued" || j.status === "processing");
    if (!active) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [jobs]);

  const submit = async () => {
    if (!scriptText.trim()) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText, avatarUrl }),
      });
      if (res.ok) await load();
    } finally {
      setSubmitting(false);
    }
  };

  const onImportAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomPreview(dataUrl);
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(f);
  };

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon">
              <UserSquare2 size={21} />
            </span>
            Avatar <span className="neon-text">qui parle</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Un présentateur animé avec lip-sync lit votre script (service D-ID). Le
            rendu tourne en file d'attente avec notification — continuez à créer
            pendant ce temps.
            {demoMode && (
              <span className="ml-1 font-semibold text-yellow-400">
                Mode démo actif (ajoutez DID_API_KEY dans .env pour le rendu réel).
              </span>
            )}
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Formulaire */}
          <div className="glass neon-border rounded-2xl p-6">
            <h2 className="font-display font-semibold">1. Choisissez votre présentateur</h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {PRESET_AVATARS.map((a) => (
                <button
                  key={a.name}
                  onClick={() => {
                    setAvatarUrl(a.url);
                    setCustomPreview(null);
                  }}
                  className={`overflow-hidden rounded-xl transition-all ${
                    avatarUrl === a.url ? "ring-2 ring-violet-500 scale-105" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={a.name} className="h-16 w-16 object-cover" />
                </button>
              ))}
              <label
                className={`glass grid h-16 w-16 cursor-pointer place-items-center rounded-xl text-muted transition-all hover:scale-105 ${
                  customPreview ? "ring-2 ring-violet-500" : ""
                }`}
                title="Importer mon avatar"
              >
                {customPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customPreview} alt="Mon avatar" className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <Upload size={18} />
                )}
                <input type="file" accept="image/*" onChange={onImportAvatar} className="hidden" />
              </label>
            </div>

            <h2 className="mt-6 font-display font-semibold">2. Le texte à faire dire</h2>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={7}
              placeholder="Collez ici votre script viral (pré-rempli depuis le Studio)…"
              className="mt-3 w-full resize-y rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
            />

            <button
              onClick={submit}
              disabled={!scriptText.trim() || submitting}
              className="btn-neon mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Lancer le rendu (file d'attente)
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Bell size={12} /> Vous serez notifié dès que la vidéo est prête.
            </p>
          </div>

          {/* File d'attente */}
          <div className="glass neon-border rounded-2xl p-6">
            <h2 className="font-display font-semibold">File d'attente de rendu</h2>
            {jobs.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Aucun rendu pour l'instant. Lancez votre premier avatar parlant ! 🎬
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {jobs.map((j) => {
                  const S = STATUS_UI[j.status];
                  return (
                    <li key={j.id} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${S.cls}`}>
                          <S.icon size={14} className={j.status === "processing" ? "animate-spin" : ""} />
                          {S.label}
                        </span>
                        <span className="text-[11px] text-muted">
                          {new Date(j.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-muted">{j.scriptText}</p>
                      {j.status === "done" && j.resultUrl && (
                        <video
                          src={j.resultUrl}
                          controls
                          className="mt-3 w-full rounded-lg"
                        />
                      )}
                      {j.status === "error" && (
                        <p className="mt-2 text-xs text-red-400">{j.error}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
