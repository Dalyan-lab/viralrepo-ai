"use client";

// Avatar présentateur (lip-sync D-ID) intégré à la Production : transforme le
// script en vidéo présentée par un avatar animé. File d'attente + polling +
// notification — l'utilisateur n'est jamais bloqué.

import { useEffect, useRef, useState } from "react";
import { UserSquare2, Loader2, CheckCircle2, XCircle, Clock, Bell, Upload, Trash2 } from "lucide-react";

type Job = {
  id: string;
  scriptText: string;
  status: "queued" | "processing" | "done" | "error";
  resultUrl?: string | null;
  error?: string | null;
  createdAt: string;
};

function svgAvatar(emoji: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/><text x="64" y="82" font-size="56" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PRESETS = [
  { name: "Nova", url: svgAvatar("🧑‍🚀", "#0ea5e9", "#8b5cf6") },
  { name: "Kai", url: svgAvatar("🤖", "#8b5cf6", "#d946ef") },
  { name: "Léa", url: svgAvatar("👩‍💻", "#f97316", "#ef4444") },
];

const STATUS_UI: Record<Job["status"], { label: string; cls: string; icon: any }> = {
  queued: { label: "En file d'attente", cls: "text-yellow-400", icon: Clock },
  processing: { label: "Animation en cours…", cls: "text-cyan-400", icon: Loader2 },
  done: { label: "Prêt !", cls: "text-emerald-400", icon: CheckCircle2 },
  error: { label: "Erreur", cls: "text-red-400", icon: XCircle },
};

export function AvatarStep({
  scriptText,
  onReadyVideo,
}: {
  scriptText: string;
  onReadyVideo?: (url: string | null) => void;
}) {
  const [avatarUrl, setAvatarUrl] = useState(PRESETS[0].url);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const notified = useRef<Set<string>>(new Set());

  const load = async () => {
    const res = await fetch("/api/avatar");
    if (!res.ok) return;
    const data = await res.json();
    setDemoMode(data.demoMode);
    setJobs((prev) => {
      for (const j of data.jobs as Job[]) {
        const old = prev.find((p) => p.id === j.id);
        if (j.status === "done" && old && old.status !== "done" && !notified.current.has(j.id)) {
          notified.current.add(j.id);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🎬 ViralRepo.AI", { body: "Votre avatar parlant est prêt !" });
          }
        }
      }
      return data.jobs;
    });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const active = jobs.some((j) => j.status === "queued" || j.status === "processing");
    if (!active) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [jobs]);

  // Remonte la dernière vidéo d'avatar prête vers la Production (incrustation).
  useEffect(() => {
    const ready = jobs.find((j) => j.status === "done" && j.resultUrl);
    onReadyVideo?.(ready?.resultUrl ?? null);
  }, [jobs, onReadyVideo]);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/avatar/${id}`, { method: "DELETE" });
      notified.current.delete(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } finally {
      setDeleting(null);
    }
  };

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

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="glass neon-border rounded-2xl p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold">
        <UserSquare2 size={16} className="text-neon-violet" /> Avatar présentateur (lip-sync)
      </h2>
      <p className="mt-1 text-xs text-muted">
        Transformez le script en vidéo présentée par un avatar animé (voix +
        lip-sync via Replicate). Rendu en file d'attente — continuez à créer
        pendant ce temps.
        {demoMode && (
          <span className="ml-1 font-semibold text-yellow-400">
            Mode démo (ajoutez REPLICATE_API_TOKEN — ou DID_API_KEY — pour le rendu réel).
          </span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {PRESETS.map((a) => (
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
            <img src={a.url} alt={a.name} className="h-14 w-14 object-cover" />
          </button>
        ))}
        <label
          className={`glass grid h-14 w-14 cursor-pointer place-items-center rounded-xl text-muted transition-all hover:scale-105 ${
            customPreview ? "ring-2 ring-violet-500" : ""
          }`}
          title="Importer mon avatar"
        >
          {customPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={customPreview} alt="Mon avatar" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <Upload size={16} />
          )}
          <input type="file" accept="image/*" onChange={onImport} className="hidden" />
        </label>

        <button
          onClick={submit}
          disabled={!scriptText.trim() || submitting}
          className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <UserSquare2 size={15} />}
          Créer l'avatar parlant
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
        <Bell size={12} /> Vous serez notifié dès que la vidéo est prête.
      </p>
      <p className="mt-1 text-[11px] text-muted">
        💡 Pour un lip-sync réaliste, importez une <strong>vraie photo de visage</strong>
        {" "}(les avatars emoji ci-dessus servent surtout à la démo).
      </p>

      {jobs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {jobs.slice(0, 5).map((j) => {
            const S = STATUS_UI[j.status];
            return (
              <li key={j.id} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${S.cls}`}>
                    <S.icon size={13} className={j.status === "processing" ? "animate-spin" : ""} />
                    {S.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted">
                      {new Date(j.createdAt).toLocaleTimeString("fr-FR")}
                    </span>
                    <button
                      onClick={() => remove(j.id)}
                      disabled={deleting === j.id || j.status === "processing"}
                      title="Supprimer ce rendu"
                      className="grid h-6 w-6 place-items-center rounded-md text-muted transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                    >
                      {deleting === j.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
                {j.status === "done" && j.resultUrl && (
                  <video src={j.resultUrl} controls className="mt-2 w-full max-w-xs rounded-lg" />
                )}
                {j.status === "done" && (
                  <p className="mt-1.5 text-[11px] text-emerald-400/80">
                    Disponible en incrustation dans l'étape « Montage &amp; Export ».
                  </p>
                )}
                {j.status === "error" && <p className="mt-1 text-xs text-red-400">{j.error}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
