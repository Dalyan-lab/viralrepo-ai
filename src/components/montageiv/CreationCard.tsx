"use client";

// Carte de création Montageiv : aperçu adapté au module + actions complètes
// (favori, renommer, dupliquer, télécharger, partager, corbeille/restaurer,
// variation). Utilisée dans les galeries des modules et la bibliothèque.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star, Download, Copy, Trash2, Pencil, Share2, RotateCcw, Wand2, Loader2, Volume2,
} from "lucide-react";
import { moduleById } from "./modules";

export type Creation = {
  id: string;
  module: string;
  name: string;
  prompt: string;
  status: string;
  resultUrl?: string | null;
  resultText?: string | null;
  favorite: boolean;
  deleted: boolean;
  createdAt: string;
};

export function CreationCard({
  creation,
  onChange,
  onVariation,
}: {
  creation: Creation;
  onChange: () => void;
  onVariation?: (c: Creation) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const mod = moduleById(creation.module);

  const patch = async (body: any) => {
    setBusy(true);
    try {
      await fetch(`/api/montageiv/creations/${creation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  };

  const rename = () => {
    const name = window.prompt("Nouveau nom :", creation.name);
    if (name?.trim()) patch({ name: name.trim() });
  };

  const hardDelete = async () => {
    if (!confirm("Supprimer définitivement cette création ?")) return;
    setBusy(true);
    await fetch(`/api/montageiv/creations/${creation.id}`, { method: "DELETE" });
    onChange();
  };

  const download = () => {
    if (!creation.resultUrl && !creation.resultText) return;
    const a = document.createElement("a");
    if (creation.resultUrl) {
      a.href = creation.resultUrl;
      const ext =
        creation.module === "image" ? "png"
        : creation.module === "musique" ? "wav"
        : creation.module === "voix" ? "mp3"
        : "mp4";
      a.download = `${creation.name.replace(/\W+/g, "-")}.${ext}`;
    } else {
      a.href = URL.createObjectURL(new Blob([creation.resultText!], { type: "text/markdown" }));
      a.download = `${creation.name.replace(/\W+/g, "-")}.md`;
    }
    a.click();
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(creation.resultText ?? creation.prompt);
      alert("Contenu copié — prêt à partager !");
    } catch {}
  };

  const speakDemo = () => {
    const u = new SpeechSynthesisUtterance(creation.prompt);
    u.lang = "fr-FR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const Icon = mod?.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border flex flex-col overflow-hidden rounded-2xl"
    >
      {/* Aperçu */}
      <div className="relative bg-black/30">
        {creation.status === "processing" ? (
          <div className="grid aspect-video place-items-center">
            <Loader2 size={22} className="animate-spin text-neon-violet" />
          </div>
        ) : creation.module === "image" && creation.resultUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creation.resultUrl} alt={creation.name} className="aspect-video w-full object-cover" />
        ) : (creation.module === "video" || creation.module === "avatar") && creation.resultUrl ? (
          <video src={creation.resultUrl} controls className="aspect-video w-full object-cover" />
        ) : (creation.module === "musique" || creation.module === "voix") && creation.resultUrl ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 px-4">
            {Icon && <Icon size={30} className="text-neon-cyan" />}
            <audio src={creation.resultUrl} controls className="w-full" />
          </div>
        ) : creation.module === "voix" ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center">
            <button onClick={speakDemo} className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
              <Volume2 size={15} /> Écouter (voix navigateur — démo)
            </button>
          </div>
        ) : creation.resultText ? (
          <div
            onClick={() => setExpanded(!expanded)}
            className={`cursor-pointer p-4 text-xs leading-relaxed text-muted ${expanded ? "" : "max-h-40 overflow-hidden"}`}
          >
            {creation.resultText}
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--bg)] to-transparent" />
            )}
          </div>
        ) : (
          <div className="grid aspect-video place-items-center text-xs text-muted">Aucun aperçu</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
          {mod?.label ?? creation.module}
        </span>
      </div>

      {/* Infos + actions */}
      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-sm font-semibold" title={creation.name}>{creation.name}</p>
        <p className="text-[10px] text-muted">{new Date(creation.createdAt).toLocaleString("fr-FR")}</p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {creation.deleted ? (
            <>
              <button onClick={() => patch({ deleted: false })} disabled={busy} title="Restaurer"
                className="glass flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs hover:scale-105">
                <RotateCcw size={12} /> Restaurer
              </button>
              <button onClick={hardDelete} disabled={busy} title="Supprimer définitivement"
                className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs text-red-400 hover:scale-105">
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => patch({ favorite: !creation.favorite })} disabled={busy} title="Favori"
                className={`grid h-7 w-7 place-items-center rounded-lg hover:scale-110 ${creation.favorite ? "bg-yellow-500/20 text-yellow-400" : "glass text-muted"}`}>
                <Star size={13} fill={creation.favorite ? "currentColor" : "none"} />
              </button>
              <button onClick={download} title="Télécharger"
                className="glass grid h-7 w-7 place-items-center rounded-lg text-muted hover:scale-110">
                <Download size={13} />
              </button>
              {onVariation && (
                <button onClick={() => onVariation(creation)} title="Variation"
                  className="glass grid h-7 w-7 place-items-center rounded-lg text-muted hover:scale-110">
                  <Wand2 size={13} />
                </button>
              )}
              <button onClick={() => patch({ action: "duplicate" })} disabled={busy} title="Dupliquer"
                className="glass grid h-7 w-7 place-items-center rounded-lg text-muted hover:scale-110">
                <Copy size={13} />
              </button>
              <button onClick={rename} title="Renommer"
                className="glass grid h-7 w-7 place-items-center rounded-lg text-muted hover:scale-110">
                <Pencil size={13} />
              </button>
              <button onClick={share} title="Partager"
                className="glass grid h-7 w-7 place-items-center rounded-lg text-muted hover:scale-110">
                <Share2 size={13} />
              </button>
              <button onClick={() => patch({ deleted: true })} disabled={busy} title="Corbeille"
                className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:scale-110">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
