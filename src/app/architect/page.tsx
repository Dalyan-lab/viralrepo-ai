"use client";

// Architecte de Studio IA : une idée brute entre, un blueprint professionnel
// complet sort — 4 piliers (Tech Stack, Pipeline, Prompts Maîtres, Conseils
// Pro), généré en streaming par l'IA (Architecte de Systèmes IA senior).

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DraftingCompass, Sparkles, Loader2, Copy, Check, FileDown,
  Layers, Workflow, Terminal, Gem,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const BUDGETS = [
  { id: "eco", label: "Éco", hint: "~50€/mois" },
  { id: "balanced", label: "Équilibré", hint: "~200€/mois" },
  { id: "premium", label: "Premium", hint: "sans limite" },
] as const;

const PILLARS = [
  { icon: Layers, title: "Tech Stack", desc: "Les meilleurs outils IA, rôle par rôle" },
  { icon: Workflow, title: "Pipeline", desc: "Le workflow pas-à-pas, idée → contenu fini" },
  { icon: Terminal, title: "Prompts Maîtres", desc: "3 templates opérationnels réutilisables" },
  { icon: Gem, title: "Conseils Pro", desc: "Cohérence, coûts, stockage : les secrets" },
];

const EXAMPLES = [
  "Chaîne YouTube faceless sur les outils IA",
  "Studio TikTok de vulgarisation crypto",
  "Média LinkedIn B2B automatisé pour SaaS",
];

// Rendu markdown léger (titres, listes, gras, citations, code)
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-[var(--fg)]">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-violet-500/15 px-1.5 py-0.5 font-mono text-[0.85em] text-neon-cyan">
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const key = `l${i}`;
        if (line.startsWith("# ")) {
          return (
            <h2 key={key} className="pt-2 font-display text-xl font-bold neon-text">
              {renderInline(line.slice(2), key)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={key} className="border-l-4 border-violet-500 pl-3 pt-4 font-display text-lg font-bold">
              {renderInline(line.slice(3), key)}
            </h3>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h4 key={key} className="pt-3 font-display text-base font-semibold text-neon-cyan">
              {renderInline(line.slice(4), key)}
            </h4>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote key={key} className="glass rounded-r-xl border-l-4 border-cyan-400 px-4 py-2.5 font-mono text-xs">
              {renderInline(line.slice(2), key)}
            </blockquote>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={key} className="flex gap-2 pl-2 text-muted">
              <span className="text-neon-violet">▸</span>
              <span>{renderInline(line.slice(2), key)}</span>
            </p>
          );
        }
        if (line.startsWith("---")) {
          return <hr key={key} className="my-3 border-[var(--border)]" />;
        }
        if (line.trim() === "") return null;
        return (
          <p key={key} className="text-muted">
            {renderInline(line, key)}
          </p>
        );
      })}
    </div>
  );
}

export default function ArchitectPage() {
  const [idea, setIdea] = useState("");
  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState<(typeof BUDGETS)[number]["id"]>("balanced");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setOutput("");
    try {
      const res = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, niche, budget }),
      });
      if (!res.ok || !res.body) throw new Error("generation failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((s) => s + decoder.decode(value, { stream: true }));
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
      }
    } catch {
      setOutput("⚠️ Erreur de génération. Vérifiez votre connexion et réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMd = () => {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "blueprint-studio-ia.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasOutput = useMemo(() => output.trim().length > 0, [output]);

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon animate-pulse-glow">
              <DraftingCompass size={21} />
            </span>
            Architecte de <span className="neon-text">Studio IA</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Une idée brute entre, un studio complet sort. L'IA endosse le rôle
            d'Architecte de Systèmes IA & Directeur de Post-Production senior et
            vous livre votre <strong>Pipeline Unifié</strong> : outils, workflow,
            prompts maîtres et secrets d'expert.
          </p>
        </motion.div>

        {/* Les 4 piliers */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass flex items-center gap-3 rounded-xl px-4 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg btn-neon">
                <p.icon size={16} />
              </span>
              <div>
                <div className="text-sm font-bold">{i + 1}. {p.title}</div>
                <div className="text-[11px] text-muted">{p.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* ---- Formulaire ---- */}
          <div className="glass neon-border h-fit rounded-2xl p-6">
            <label className="mb-1.5 block text-sm font-semibold">
              💡 Votre idée brute
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              placeholder="Ex : je veux produire 3 vidéos YouTube + 15 Shorts par semaine sur l'actu IA, seul, en 10h max…"
              className="w-full resize-y rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setIdea(ex)}
                  className="glass rounded-full px-3 py-1 text-[11px] text-muted transition-colors hover:text-[var(--fg)]"
                >
                  {ex}
                </button>
              ))}
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-semibold">
              🎯 Niche (optionnel)
            </label>
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex : IA & dev, crypto, fitness…"
              className="w-full rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
            />

            <label className="mb-1.5 mt-5 block text-sm font-semibold">
              💰 Budget
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBudget(b.id)}
                  className={`rounded-xl px-2 py-2.5 text-center transition-all ${
                    budget === b.id ? "btn-neon scale-[1.03]" : "glass hover:scale-[1.02]"
                  }`}
                >
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div className={`text-[10px] ${budget === b.id ? "text-white/80" : "text-muted"}`}>
                    {b.hint}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={generating || !idea.trim()}
              className="btn-neon mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? "L'architecte conçoit votre studio…" : "Générer mon blueprint"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Blueprint complet en ~60 s, exportable en Markdown.
            </p>
          </div>

          {/* ---- Sortie ---- */}
          <div className="glass neon-border flex min-h-[560px] flex-col rounded-2xl p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold">
                Votre <span className="neon-text">Blueprint</span>
              </h2>
              {hasOutput && !generating && (
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:scale-[1.03]"
                  >
                    {copied ? <Check size={13} className="text-neon-lime" /> : <Copy size={13} />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                  <button
                    onClick={downloadMd}
                    className="glass flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:scale-[1.03]"
                  >
                    <FileDown size={13} /> Export .md
                  </button>
                </div>
              )}
            </div>

            <div
              ref={outputRef}
              className={`max-h-[70vh] flex-1 overflow-y-auto pr-2 ${generating ? "stream-caret" : ""}`}
            >
              {hasOutput ? (
                <Markdown text={output} />
              ) : (
                <div className="grid h-full min-h-[420px] place-items-center text-center">
                  <div>
                    <DraftingCompass size={40} className="mx-auto text-muted opacity-40" />
                    <p className="mt-4 max-w-sm text-sm text-muted">
                      Décrivez votre projet à gauche : l'architecte vous livre la
                      tech stack, le pipeline de production, 3 prompts maîtres et
                      ses conseils d'optimisation — en direct, section par section.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
