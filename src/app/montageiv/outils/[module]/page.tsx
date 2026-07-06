"use client";

// Atelier d'un module Montageiv IA — design « composer » (façon suite créative) :
// hero d'accueil, pastille de bascule entre modules, barre de prompt avec
// contrôles en ligne (rendus depuis la config du module), puis galerie.
// La logique (crédits, génération, sondage async) est conservée à l'identique.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import {
  ChevronDown, Loader2, Sparkles, Zap, Upload, Minus, Plus, SlidersHorizontal, X, Type,
} from "lucide-react";
import { MODULES, moduleById, Field } from "@/components/montageiv/modules";
import { Creation, CreationCard } from "@/components/montageiv/CreationCard";

const TRIO = ["image", "video", "musique"]; // bascule rapide (comme la maquette)

/** Contrôle compact affiché dans la barre du composer. */
function InlineControl({ field, value, onChange }: { field: Field; value: any; onChange: (v: any) => void }) {
  switch (field.kind) {
    case "select":
      return (
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-xs">
          <span className="text-muted">{field.label}</span>
          <select
            value={value ?? field.def}
            onChange={(e) => onChange(e.target.value)}
            className="cursor-pointer rounded-full bg-transparent py-1 pr-1 font-medium outline-none [&>option]:bg-[var(--bg)]"
          >
            {field.options.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
        </div>
      );
    case "number":
      return (
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1 text-xs">
          <span className="text-muted">{field.label}</span>
          <button type="button" onClick={() => onChange(Math.max(field.min, (value ?? field.def) - 1))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10"><Minus size={12} /></button>
          <span className="w-5 text-center font-semibold tabular-nums">{value ?? field.def}</span>
          <button type="button" onClick={() => onChange(Math.min(field.max, (value ?? field.def) + 1))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10"><Plus size={12} /></button>
        </div>
      );
    case "toggle": {
      const on = value ?? field.def ?? false;
      return (
        <button
          type="button"
          onClick={() => onChange(!on)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? "border-violet-500 bg-violet-500/20 text-[var(--fg)]" : "border-white/10 bg-white/5 text-muted hover:text-[var(--fg)]"}`}
        >
          {field.label}
        </button>
      );
    }
    case "text":
      return (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none placeholder:text-muted focus:border-violet-500/60"
        />
      );
    case "image":
      return null; // les images vont dans la colonne de gauche
  }
}

/** Bouton d'upload d'image (colonne de gauche du composer). */
function UploadTile({ field, value, onChange }: { field: Field & { kind: "image" }; value: any; onChange: (v: any) => void }) {
  return (
    <label className="relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-muted transition hover:bg-white/10 hover:text-[var(--fg)]">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-8 w-8 rounded-lg object-cover" />
      ) : (
        <Upload size={16} />
      )}
      <span className="leading-tight">{field.label}</span>
      {value && (
        <span
          onClick={(e) => { e.preventDefault(); onChange(undefined); }}
          className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-black/60 text-white"
        ><X size={10} /></span>
      )}
      <input
        type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onChange(r.result as string);
          r.readAsDataURL(f);
        }}
      />
    </label>
  );
}

/** Tuile d'action rapide ouvrant les options (Style, Caractère, Objet…). */
function OptionTile({ label, filled, onOpen }: { label: string; filled: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-[11px] font-medium transition ${filled ? "border-violet-500 bg-violet-500/15 text-[var(--fg)]" : "border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-[var(--fg)]"}`}
    >
      <Type size={16} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function Workspace() {
  const { module: moduleId } = useParams<{ module: string }>();
  const search = useSearchParams();
  const mod = moduleById(moduleId);
  if (!mod) notFound();

  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState("");
  const [creations, setCreations] = useState<Creation[] | null>(null);

  useEffect(() => {
    const p = search.get("prompt");
    if (p) setPrompt(p);
  }, [search]);

  // Réinitialise l'état quand on change de module (bascule pastille)
  useEffect(() => {
    setParams({});
    setShowAdvanced(false);
    setNote("");
  }, [moduleId]);

  const load = useCallback(async () => {
    const d = await fetch(`/api/montageiv/creations?module=${mod!.id}`).then((r) => r.json());
    setCreations(d.creations ?? []);
  }, [mod]);

  useEffect(() => { load(); }, [load]);

  const count = mod!.id === "image" ? Number(params.count ?? 1) : 1;
  const cost = mod!.cost * count;

  const pollAsync = async (
    creationId: string,
    kind: "video" | "avatar" | "replicate",
    taskOrJobId: string
  ) => {
    const finish = (url: string) =>
      fetch(`/api/montageiv/creations/${creationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultUrl: url, status: "done" }),
      }).then(load);

    for (let i = 0; i < 72; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        if (kind === "replicate") {
          const st = await fetch(`/api/montageiv/replicate/${taskOrJobId}`).then((r) => r.json());
          if (st.status === "succeeded" && st.url) return finish(st.url);
          if (st.status === "failed" || st.status === "canceled" || st.status === "error") break;
        } else if (kind === "video") {
          const st = await fetch(`/api/video/${taskOrJobId}`).then((r) => r.json());
          if (st.status === "done" && st.videoUrl) {
            await fetch(`/api/montageiv/creations/${creationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resultUrl: st.videoUrl, status: "done" }),
            });
            return load();
          }
          if (st.status === "error") break;
        } else {
          const st = await fetch(`/api/avatar/${taskOrJobId}`).then((r) => r.json());
          if (st.job?.status === "done" && st.job.resultUrl) {
            await fetch(`/api/montageiv/creations/${creationId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resultUrl: st.job.resultUrl, status: "done" }),
            });
            return load();
          }
          if (st.job?.status === "error") break;
        }
      } catch {}
    }
    await fetch(`/api/montageiv/creations/${creationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error" }),
    });
    load();
  };

  const generate = async (overridePrompt?: string, overrideParams?: Record<string, any>) => {
    const p = overridePrompt ?? prompt;
    if (!p.trim() || generating) return;
    setGenerating(true);
    setNote("");
    try {
      const res = await fetch("/api/montageiv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: mod!.id, prompt: p, params: overrideParams ?? params }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNote(`⚠️ ${data.error ?? "Erreur de génération."}`);
        return;
      }
      const asyncJob = data.replicateId || data.taskId || data.jobId;
      if (data.demo) {
        setNote(
          mod!.id === "musique"
            ? "🎵 Mélodie synthétisée localement (démo — ajoutez REPLICATE_API_TOKEN pour la vraie musique IA)."
            : "Mode démo : ajoutez REPLICATE_API_TOKEN (ou la clé du module) dans .env pour un résultat réel."
        );
      } else if (asyncJob) {
        setNote(`⏳ Génération lancée (−${data.cost} crédits) — le résultat apparaîtra dans la galerie.`);
      } else {
        setNote(`✅ Génération réussie (−${data.cost} crédits).`);
      }
      await load();
      const first = data.creations?.[0];
      if (first && data.replicateId) pollAsync(first.id, "replicate", data.replicateId);
      if (first && data.taskId) pollAsync(first.id, "video", data.taskId);
      if (first && data.jobId) pollAsync(first.id, "avatar", data.jobId);
      window.dispatchEvent(new Event("focus"));
    } catch {
      setNote("⚠️ Erreur réseau — réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const variation = (c: Creation) => {
    setPrompt(c.prompt);
    generate(c.prompt);
  };

  const imageFields = useMemo(() => mod!.main.filter((f) => f.kind === "image") as (Field & { kind: "image" })[], [mod]);
  const inlineFields = useMemo(() => mod!.main.filter((f) => f.kind !== "image"), [mod]);
  // Tuiles d'action rapide (colonne gauche) : uploads + 1ers champs texte des options.
  const textTiles = useMemo(
    () => (mod!.advanced.filter((f) => f.kind === "text") as (Field & { kind: "text" })[]).slice(0, imageFields.length ? 3 : 4),
    [mod, imageFields.length]
  );
  const showOptionsTile = mod!.advanced.length > 0 && textTiles.length === 0;
  const hasLeftColumn = imageFields.length > 0 || textTiles.length > 0 || showOptionsTile;
  const hasCreations = creations && creations.length > 0;
  const ModIcon = mod!.icon;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-4xl flex-col">
      {/* Hero d'accueil */}
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Bonjour,</h1>
        <p className="mt-2 bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-2xl font-medium text-transparent sm:text-3xl">
          {mod!.greeting}
        </p>
      </div>

      {/* Composer */}
      <div className="sticky bottom-24 space-y-3">
        {/* Pastille de bascule module */}
        <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-xl">
          {MODULES.filter((m) => TRIO.includes(m.id)).map((m) => {
            const active = m.id === mod!.id;
            return (
              <Link
                key={m.id}
                href={`/montageiv/outils/${m.id}`}
                title={m.label}
                className={`grid h-8 w-8 place-items-center rounded-full transition ${active ? "bg-white text-black" : "text-muted hover:text-[var(--fg)]"}`}
              >
                <m.icon size={16} />
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px bg-white/10" />
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black">
            <Sparkles size={13} /> {mod!.action}
          </span>
        </div>

        {/* Carte du composer */}
        <div className="rounded-2xl border border-white/10 bg-black/50 p-3 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Colonne gauche : uploads + tuiles d'options (façon 2×2) */}
            {hasLeftColumn && (
              <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-44 sm:grid-cols-2">
                {imageFields.map((f) => (
                  <UploadTile key={f.key} field={f} value={params[f.key]} onChange={(v) => setParams((s) => ({ ...s, [f.key]: v }))} />
                ))}
                {textTiles.map((f) => (
                  <OptionTile
                    key={f.key}
                    label={f.label}
                    filled={!!params[f.key]}
                    onOpen={() => setShowAdvanced(true)}
                  />
                ))}
                {showOptionsTile && (
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-[11px] font-medium transition ${showAdvanced ? "border-violet-500 bg-violet-500/15 text-[var(--fg)]" : "border-white/10 bg-white/5 text-muted hover:bg-white/10 hover:text-[var(--fg)]"}`}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Options</span>
                  </button>
                )}
              </div>
            )}

            {/* Prompt */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder={mod!.promptLabel}
              className="min-h-[96px] w-full resize-none rounded-xl bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted"
            />
          </div>

          {/* Contrôles avancés dépliés */}
          {showAdvanced && mod!.advanced.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              {mod!.advanced.map((f) => (
                <InlineControl key={f.key} field={f} value={params[f.key]} onChange={(v) => setParams((s) => ({ ...s, [f.key]: v }))} />
              ))}
            </div>
          )}

          {/* Barre de contrôles + Générer */}
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            {inlineFields.map((f) => (
              <InlineControl key={f.key} field={f} value={params[f.key]} onChange={(v) => setParams((s) => ({ ...s, [f.key]: v }))} />
            ))}

            <button
              onClick={() => generate()}
              disabled={generating || !prompt.trim()}
              className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {generating ? "Génération…" : mod!.cta}
              <span className="flex items-center gap-0.5 rounded-full bg-black/25 px-2 py-0.5 text-xs">
                <Zap size={11} /> {cost}
              </span>
            </button>
          </div>

          {generating && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 bg-[length:200%_100%]" />
            </div>
          )}
        </div>
        {note && <p className="text-center text-xs text-muted">{note}</p>}
      </div>

      {/* Galerie des créations */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <ChevronDown size={16} className="text-muted" />
          <h2 className="font-display font-semibold">
            Vos créations <span className="neon-text">{mod!.label}</span>
          </h2>
        </div>
        {creations === null ? (
          <div className="grid h-40 place-items-center">
            <Loader2 size={22} className="animate-spin text-neon-violet" />
          </div>
        ) : !hasCreations ? (
          <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-muted">
            Votre première création apparaîtra ici ✨
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {creations!.map((c) => (
              <CreationCard key={c.id} creation={c} onChange={load} onVariation={variation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModulePage() {
  return (
    <Suspense fallback={null}>
      <Workspace />
    </Suspense>
  );
}
