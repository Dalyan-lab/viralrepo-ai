"use client";

// Atelier d'un module Montageiv IA : zone de prompt, paramètres (rendus depuis
// la config du module), génération avec progression, galerie des résultats.
// Les modules asynchrones (vidéo Runway, avatar D-ID) sont sondés côté client.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Sparkles, Zap } from "lucide-react";
import { moduleById, Field } from "@/components/montageiv/modules";
import { Creation, CreationCard } from "@/components/montageiv/CreationCard";

function FieldInput({
  field, value, onChange,
}: { field: Field; value: any; onChange: (v: any) => void }) {
  switch (field.kind) {
    case "select":
      return (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{field.label}</span>
          <select
            value={value ?? field.def}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
          >
            {field.options.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
        </label>
      );
    case "number":
      return (
        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-medium text-muted">
            {field.label} <span className="font-bold text-[var(--fg)]">{value ?? field.def}</span>
          </span>
          <input
            type="range"
            min={field.min}
            max={field.max}
            value={value ?? field.def}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </label>
      );
    case "toggle":
      return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl glass px-3 py-2.5">
          <span className="text-xs font-medium">{field.label}</span>
          <button
            type="button"
            onClick={() => onChange(!(value ?? field.def ?? false))}
            className={`h-5 w-9 rounded-full transition-colors ${value ?? field.def ? "bg-violet-500" : "bg-[var(--border)]"}`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-white transition-transform ${value ?? field.def ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </label>
      );
    case "text":
      return (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{field.label}</span>
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
          />
        </label>
      );
    case "image":
      return (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{field.label}</span>
          <div className="flex items-center gap-2">
            <label className="glass flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:scale-[1.02]">
              Téléverser
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => onChange(r.result as string);
                  r.readAsDataURL(f);
                }}
              />
            </label>
            {value && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-10 w-10 rounded-lg object-cover" />
            )}
          </div>
        </label>
      );
  }
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

  // Pré-remplissage (Templates / Explorer)
  useEffect(() => {
    const p = search.get("prompt");
    if (p) setPrompt(p);
  }, [search]);

  const load = useCallback(async () => {
    const d = await fetch(`/api/montageiv/creations?module=${mod!.id}`).then((r) => r.json());
    setCreations(d.creations ?? []);
  }, [mod]);

  useEffect(() => {
    load();
  }, [load]);

  const count = mod!.id === "image" ? Number(params.count ?? 1) : 1;
  const cost = mod!.cost * count;

  // Sonde une tâche asynchrone (vidéo Runway / avatar D-ID) puis met à jour la création.
  const pollAsync = async (creationId: string, kind: "video" | "avatar", taskOrJobId: string) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        if (kind === "video") {
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
      if (data.demo) {
        setNote(
          mod!.id === "musique"
            ? "🎵 Mélodie synthétisée localement (module démo — API musicale à brancher)."
            : "Mode démo : ajoutez la clé API correspondante dans .env pour un résultat réel."
        );
      } else {
        setNote(`✅ Génération réussie (−${data.cost} crédits).`);
      }
      await load();
      // Suivi asynchrone
      const first = data.creations?.[0];
      if (first && data.taskId) pollAsync(first.id, "video", data.taskId);
      if (first && data.jobId) pollAsync(first.id, "avatar", data.jobId);
      // Rafraîchit la jauge de crédits du header
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

  const Icon = mod!.icon;
  const fields = useMemo(() => ({ main: mod!.main, advanced: mod!.advanced }), [mod]);

  return (
    <div>
      {/* Header du module */}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon">
          <Icon size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">{mod!.label}</h1>
          <p className="text-sm text-muted">{mod!.tagline}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Panneau de génération */}
        <div className="glass neon-border h-fit rounded-2xl p-5">
          <label className="mb-1.5 block text-sm font-semibold">{mod!.promptLabel}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={mod!.promptPlaceholder}
            className="w-full resize-y rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fields.main.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={params[f.key]}
                onChange={(v) => setParams((s) => ({ ...s, [f.key]: v }))}
              />
            ))}
          </div>

          {fields.advanced.length > 0 && (
            <>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-4 flex items-center gap-1.5 text-xs font-semibold neon-text"
              >
                <ChevronDown size={13} className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                Paramètres avancés
              </button>
              {showAdvanced && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {fields.advanced.map((f) => (
                    <FieldInput
                      key={f.key}
                      field={f}
                      value={params[f.key]}
                      onChange={(v) => setParams((s) => ({ ...s, [f.key]: v }))}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <button
            onClick={() => generate()}
            disabled={generating || !prompt.trim()}
            className="btn-neon mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-50"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Génération en cours…" : mod!.cta}
            <span className="flex items-center gap-0.5 rounded-full bg-black/25 px-2 py-0.5 text-xs">
              <Zap size={11} /> {cost}
            </span>
          </button>

          {generating && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 bg-[length:200%_100%]" />
            </div>
          )}
          {note && <p className="mt-3 text-xs text-muted">{note}</p>}
        </div>

        {/* Galerie des résultats */}
        <div>
          <h2 className="mb-4 font-display font-semibold">
            Vos créations <span className="neon-text">{mod!.label}</span>
          </h2>
          {creations === null ? (
            <div className="grid h-40 place-items-center">
              <Loader2 size={22} className="animate-spin text-neon-violet" />
            </div>
          ) : creations.length === 0 ? (
            <div className="glass grid h-40 place-items-center rounded-2xl text-sm text-muted">
              Votre première création apparaîtra ici ✨
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {creations.map((c) => (
                <CreationCard key={c.id} creation={c} onChange={load} onVariation={variation} />
              ))}
            </div>
          )}
        </div>
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
