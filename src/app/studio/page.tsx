"use client";

// Studio viral : génération du script en streaming mot-à-mot (Gemini),
// aperçu Reel vertical, voix off, export MP4 et partage direct.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Download, Share2, Clapperboard,
  Save, Check, Loader2, FileText, Youtube, Twitter, Music2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { ReelPreview } from "@/components/ReelPreview";
import { exportReelVideo } from "@/lib/exportVideo";
import type { TrendingRepo } from "@/lib/github";
import { DEMO_REPOS } from "@/lib/github";

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", hint: "30-45s · punchy", icon: Music2 },
  { id: "reels", label: "Reels", hint: "30-45s · vertical", icon: Clapperboard },
  { id: "shorts", label: "Shorts", hint: "≤60s · hook fort", icon: Youtube },
  { id: "youtube", label: "YouTube", hint: "3-5 min · détaillé", icon: Youtube },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

export default function StudioPage() {
  const [repo, setRepo] = useState<TrendingRepo>(DEMO_REPOS[0]);
  const [platform, setPlatform] = useState<PlatformId>("tiktok");
  const [script, setScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Export vidéo
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [exportLabel, setExportLabel] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("vr-selected-repo");
    if (stored) {
      try {
        setRepo(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const lines = useMemo(
    () =>
      script
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 1),
    [script]
  );

  const generate = async () => {
    setGenerating(true);
    setScript("");
    setSaved(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, platform }),
      });
      if (!res.ok || !res.body) throw new Error("generation failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setScript((s) => s + decoder.decode(value, { stream: true }));
      }
    } catch {
      setScript("⚠️ Erreur de génération. Vérifiez votre connexion et réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  const saveScript = async () => {
    const res = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoName: repo.fullName,
        repoUrl: repo.url,
        platform,
        content: script,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  // --- Export MP4 ---
  const exportVideo = async () => {
    if (lines.length === 0) return;
    setExporting(true);
    setExportPct(0);
    try {
      const { blob, ext } = await exportReelVideo({
        lines,
        repoName: repo.fullName,
        badge: repo.badge,
        onProgress: (pct, label) => {
          setExportPct(pct);
          setExportLabel(label);
        },
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `viralrepo-${repo.name}-${platform}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert("Échec de l'export vidéo. Réessayez dans Chrome ou Edge.");
    } finally {
      setExporting(false);
    }
  };

  // --- Partage ---
  const shareText = `🔥 Le repo ${repo.fullName} explose sur GitHub (+${repo.velocity} ⭐/jour) ! Script généré avec ViralRepo.AI ⚡ ${repo.url}`;
  const shareX = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  const shareTikTok = () => window.open("https://www.tiktok.com/upload", "_blank");
  const shareYouTube = () =>
    window.open("https://studio.youtube.com/channel/upload", "_blank");
  const downloadTxt = () => {
    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `script-${repo.name}-${platform}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">
            Studio <span className="neon-text">viral</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Repo sélectionné :{" "}
            <a href={repo.url} target="_blank" rel="noreferrer" className="neon-text font-semibold hover:underline">
              {repo.fullName}
            </a>{" "}
            · +{repo.velocity} ⭐/jour ·{" "}
            <span className="font-bold text-orange-400">🔥 {repo.badge}</span>
            {" · "}
            <Link href="/dashboard" className="underline hover:text-[var(--fg)]">
              changer de repo
            </Link>
          </p>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* ---- Colonne gauche : génération ---- */}
          <div className="space-y-6">
            {/* Choix plateforme */}
            <div className="glass neon-border rounded-2xl p-5">
              <h2 className="font-display font-semibold">1. Plateforme cible</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-xl p-3 text-left transition-all ${
                      platform === p.id
                        ? "btn-neon scale-[1.03]"
                        : "glass hover:scale-[1.02]"
                    }`}
                  >
                    <p.icon size={17} className="mb-1.5" />
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className={`text-[11px] ${platform === p.id ? "text-white/80" : "text-muted"}`}>
                      {p.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Script */}
            <div className="glass neon-border rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-semibold">2. Script viral</h2>
                <button
                  onClick={generate}
                  disabled={generating}
                  className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  {generating
                    ? "Génération en direct…"
                    : script
                      ? "Régénérer"
                      : "Générer le script en 1 clic"}
                </button>
              </div>

              <div className="relative mt-4">
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Cliquez sur « Générer » : le script s'écrit ici mot-à-mot, en direct. Vous pourrez ensuite le retoucher librement."
                  rows={12}
                  className={`w-full resize-y rounded-xl glass px-4 py-3 text-sm leading-relaxed outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)] ${
                    generating ? "stream-caret" : ""
                  }`}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={saveScript}
                  disabled={!script || generating}
                  className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  {saved ? <Check size={15} className="text-neon-lime" /> : <Save size={15} />}
                  {saved ? "Sauvegardé !" : "Sauvegarder"}
                </button>
                <button
                  onClick={downloadTxt}
                  disabled={!script}
                  className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium hover:scale-[1.02] disabled:opacity-50"
                >
                  <FileText size={15} /> Export .txt
                </button>
                <button
                  onClick={shareX}
                  disabled={!script}
                  className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium hover:scale-[1.02] disabled:opacity-50"
                >
                  <Twitter size={15} /> X
                </button>
                <button
                  onClick={shareTikTok}
                  disabled={!script}
                  className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium hover:scale-[1.02] disabled:opacity-50"
                >
                  <Music2 size={15} /> TikTok
                </button>
                <button
                  onClick={shareYouTube}
                  disabled={!script}
                  className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium hover:scale-[1.02] disabled:opacity-50"
                >
                  <Youtube size={15} /> YouTube
                </button>
              </div>
            </div>

          </div>

          {/* ---- Colonne droite : aperçu + export ---- */}
          <div className="space-y-5">
            <div className="glass neon-border rounded-2xl p-5">
              <h2 className="mb-4 text-center font-display font-semibold">
                Aperçu <span className="neon-text">Reel</span>
              </h2>
              <ReelPreview
                lines={lines}
                repoName={repo.fullName}
                badge={repo.badge}
                ttsEnabled={ttsEnabled}
                onToggleTts={() => setTtsEnabled((v) => !v)}
              />

              <button
                onClick={exportVideo}
                disabled={lines.length === 0 || exporting}
                className="btn-neon mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-50"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? exportLabel || "Export en cours…" : "Exporter la vidéo MP4"}
              </button>

              {exporting && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all"
                      style={{ width: `${exportPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-muted">{exportPct}%</p>
                </div>
              )}

              <p className="mt-3 text-center text-[11px] text-muted">
                MP4 vertical 720×1280 généré dans votre navigateur (canvas +
                ffmpeg.wasm). Pour la voix off et l'avatar, passez par la Production.
              </p>
            </div>

            <div className="glass rounded-2xl p-5 text-sm">
              <h3 className="flex items-center gap-2 font-display font-semibold">
                <Share2 size={15} className="text-neon-cyan" /> Conseil viral
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Publiez dans les 24h suivant le badge 🔥 EXPLOSIF : c'est la fenêtre
                où l'algorithme pousse le plus les sujets émergents. Ajoutez une
                miniature percutante depuis l'onglet Miniatures.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
