"use client";

// STUDIO DE PRODUCTION — Pipeline Unifié : une idée brute entre,
// des contenus finalisés (long + courts formats) sortent.
// Étape 1 : Idéation & Scripting (script 2 colonnes AUDIO / VISUEL)
// Étape 2 : Production des Assets (images IA + voix off)
// Étape 3 : Montage & export MP4 (Ken Burns + sous-titres dynamiques)
// Étape 4 : Déclinaison cross-canal (hooks viraux → Shorts verticaux)

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard, Sparkles, Loader2, Mic, Square, Upload, Download,
  Volume2, ImageIcon, Scissors, Check, ChevronRight, Youtube, Smartphone,
  RefreshCw, Film, Trash2, UserSquare2, Twitter, Music2, Share2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";
import { AvatarStep } from "@/components/AvatarStep";
import { exportMontage, sceneDuration } from "@/lib/montage";
import type { ViralHook } from "@/lib/production";

type Scene = {
  audio: string;
  visuel: string;
  imageUrl: string | null;
  imgStatus: "idle" | "loading" | "done" | "demo";
  videoUrl: string | null;
  vidStatus: "idle" | "processing" | "done" | "demo" | "error";
};

const STEPS = [
  { n: 1, title: "Idéation & Scripting", icon: Sparkles },
  { n: 2, title: "Production des Assets", icon: ImageIcon },
  { n: 3, title: "Montage & Export", icon: Film },
  { n: 4, title: "Déclinaison Shorts", icon: Scissors },
];

function parseScenes(text: string): { audio: string; visuel: string }[] {
  return text
    .split(/SC[ÈE]NE\s+\d+/i)
    .slice(1)
    .map((b) => {
      const audio =
        b.match(/AUDIO\s*:\s*([\s\S]*?)(?=VISUEL\s*:|$)/i)?.[1]?.trim() ?? "";
      const visuel = b.match(/VISUEL\s*:\s*([\s\S]*?)$/i)?.[1]?.trim() ?? "";
      return { audio: audio.replace(/\n+/g, " "), visuel: visuel.replace(/\n+/g, " ") };
    })
    .filter((s) => s.audio.length > 3);
}

// Visuel procédural déterministe (mode démo, généré localement)
function demoImage(index: number, vertical: boolean): string {
  const W = vertical ? 720 : 1280;
  const H = vertical ? 1280 : 720;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rand = (n: number) => {
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  ctx.fillStyle = "#070214";
  ctx.fillRect(0, 0, W, H);
  const hues = [190, 265, 300, 15, 330];
  for (let i = 0; i < 12; i++) {
    const g = ctx.createRadialGradient(
      rand(i) * W, rand(i + 50) * H, 0,
      rand(i) * W, rand(i + 50) * H, 120 + rand(i + 100) * (W / 3)
    );
    g.addColorStop(0, `hsla(${hues[(index + i) % hues.length]}, 95%, 60%, ${0.15 + rand(i + 200) * 0.3})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return c.toDataURL("image/jpeg", 0.85);
}

export default function ProductionPage() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);

  // Étape 1
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<"youtube" | "short">("youtube");
  const [tone, setTone] = useState("");
  const [scriptRaw, setScriptRaw] = useState("");
  const [generating, setGenerating] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);

  // Étape 2
  const [batchRunning, setBatchRunning] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [ttsVoice, setTtsVoice] = useState("charlotte");
  const [voiceGen, setVoiceGen] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const [batchVideo, setBatchVideo] = useState(false);
  const [videoMsg, setVideoMsg] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Avatar présentateur (remonté depuis AvatarStep) — incrustation optionnelle
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);

  // Étape 3
  const [exporting, setExporting] = useState(false);
  const [exportPct, setExportPct] = useState(0);
  const [exportLabel, setExportLabel] = useState("");
  const [exportedOnce, setExportedOnce] = useState(false);
  const [useVoiceover, setUseVoiceover] = useState(true); // muxer la voix off
  const [usePresenter, setUsePresenter] = useState(true); // incruster l'avatar

  // Étape 4
  const [hooks, setHooks] = useState<ViralHook[]>([]);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hooksDemo, setHooksDemo] = useState(false);
  const [shortExporting, setShortExporting] = useState<number | null>(null);
  const [shortPct, setShortPct] = useState(0);

  const vertical = format === "short";
  const goTo = (n: number) => {
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
  };

  // Script envoyé depuis le Studio → préremplit « Idée brute ».
  useEffect(() => {
    const fromStudio = sessionStorage.getItem("vr-production-idea");
    if (fromStudio) {
      setIdea(fromStudio);
      sessionStorage.removeItem("vr-production-idea");
    }
  }, []);

  // Partage / publication (déplacé depuis le Studio)
  const shareText =
    "🎬 Nouvelle vidéo créée avec ViralRepo.AI ⚡ Je détecte les repos IA qui explosent et les transforme en vidéos virales.";
  const shareX = () =>
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareTikTok = () => window.open("https://www.tiktok.com/upload", "_blank");
  const shareYouTube = () => window.open("https://studio.youtube.com/channel/upload", "_blank");

  const totalDuration = useMemo(
    () => Math.round(scenes.reduce((a, s) => a + sceneDuration(s.audio), 0)),
    [scenes]
  );

  // ---- Étape 1 : génération du script ----
  const generateScript = async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setScriptRaw("");
    setScenes([]);
    try {
      const res = await fetch("/api/production/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, format, tone }),
      });
      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setScriptRaw(acc);
        setScenes(
          parseScenes(acc).map((s, i) => ({
            ...s,
            imageUrl: null,
            imgStatus: "idle" as const,
            videoUrl: null,
            vidStatus: "idle" as const,
          }))
        );
      }
    } catch {
      setScriptRaw("⚠️ Erreur de génération. Réessayez.");
    } finally {
      setGenerating(false);
    }
  };

  // ---- Étape 2 : assets ----
  const generateImage = async (index: number) => {
    setScenes((prev) =>
      prev.map((s, i) => (i === index ? { ...s, imgStatus: "loading" } : s))
    );
    try {
      const res = await fetch("/api/production/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: scenes[index].visuel, vertical }),
      });
      const data = await res.json();
      const url = data.image ?? demoImage(index, vertical);
      const status = data.image ? "done" : "demo";
      setScenes((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, imageUrl: url, imgStatus: status } : s
        )
      );
    } catch {
      setScenes((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, imageUrl: demoImage(index, vertical), imgStatus: "demo" }
            : s
        )
      );
    }
  };

  const generateAllImages = async () => {
    setBatchRunning(true);
    for (let i = 0; i < scenes.length; i++) {
      if (!scenes[i].imageUrl) await generateImage(i);
    }
    setBatchRunning(false);
  };

  // ---- Vidéo IA : anime l'image d'une scène (Runway), polling piloté client ----
  const setVid = (index: number, patch: Partial<Scene>) =>
    setScenes((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  // Renvoie l'issue explicite pour piloter la boucle et le message (évite de
  // lire l'état périmé après un setState asynchrone).
  const generateVideo = async (
    index: number
  ): Promise<"done" | "demo" | "error"> => {
    const scene = scenes[index];
    if (!scene?.imageUrl) return "error";
    setVid(index, { vidStatus: "processing" });
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: scene.imageUrl, prompt: scene.visuel, vertical }),
      });
      const data = await res.json();
      if (data.demo) {
        setVid(index, { vidStatus: "demo" });
        return "demo";
      }
      if (!data.taskId) {
        setVid(index, { vidStatus: "error" });
        return "error";
      }
      // Polling jusqu'à obtention du clip (Runway : ~1-2 min par plan)
      for (let tries = 0; tries < 60; tries++) {
        await new Promise((r) => setTimeout(r, 6000));
        const st = await fetch(`/api/video/${data.taskId}`).then((r) => r.json());
        if (st.status === "done" && st.videoUrl) {
          setVid(index, { vidStatus: "done", videoUrl: st.videoUrl });
          return "done";
        }
        if (st.status === "error") {
          setVid(index, { vidStatus: "error" });
          return "error";
        }
      }
      setVid(index, { vidStatus: "error" });
      return "error";
    } catch {
      setVid(index, { vidStatus: "error" });
      return "error";
    }
  };

  const generateAllVideos = async () => {
    setBatchVideo(true);
    setVideoMsg("");
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageUrl && !scenes[i].videoUrl) {
        const outcome = await generateVideo(i);
        // Sans clé Runway : inutile de continuer, on informe et on s'arrête.
        if (outcome === "demo") {
          setBatchVideo(false);
          setVideoMsg(
            "Mode démo : ajoutez RUNWAY_API_KEY dans .env pour animer réellement les scènes. Le montage garde l'effet Ken Burns."
          );
          return;
        }
      }
    }
    setBatchVideo(false);
    setVideoMsg("Plans vidéo IA générés — ils remplaceront les images fixes dans le montage.");
  };

  // Voix off IA (ElevenLabs) pour l'ensemble du script → muxée dans le montage.
  const generateAIVoice = async () => {
    if (scenes.length === 0) return;
    setVoiceGen(true);
    setVoiceNote("");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scenes.map((s) => s.audio).join(". "),
          voice: ttsVoice,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("audio")) {
        const blob = await res.blob();
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setVoiceNote("✨ Voix off IA générée — elle sera muxée dans la vidéo.");
      } else {
        const data = await res.json().catch(() => ({}));
        setVoiceNote(
          data.demo
            ? "Mode démo : ajoutez ELEVENLABS_API_KEY dans .env pour la vraie voix IA."
            : data.error || "Échec de la génération vocale."
        );
      }
    } catch {
      setVoiceNote("Erreur réseau — réessayez.");
    } finally {
      setVoiceGen(false);
    }
  };

  const speakScene = (text: string) => {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    const fr = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("fr"));
    if (fr) u.voice = fr;
    window.speechSynthesis.speak(u);
  };

  const toggleRecord = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      alert("Micro inaccessible. Vérifiez les permissions.");
    }
  };

  const onImportAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioBlob(f);
    setAudioUrl(URL.createObjectURL(f));
  };

  // Supprime la voix off (prise ratée) pour en refaire une autre.
  const clearVoice = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setVoiceNote("");
  };

  // ---- Étape 3 : montage ----
  const exportVideo = async () => {
    setExporting(true);
    setExportPct(0);
    try {
      const { blob, ext } = await exportMontage({
        scenes: scenes.map((s) => ({
          caption: s.audio,
          imageUrl: s.imageUrl,
          videoUrl: s.videoUrl,
        })),
        vertical,
        audioBlob: useVoiceover ? audioBlob : null,
        presenterVideoUrl: usePresenter ? avatarVideoUrl : null,
        onProgress: (pct, label) => {
          setExportPct(pct);
          setExportLabel(label);
        },
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `production-${format}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      setExportedOnce(true);
    } catch {
      alert("Échec de l'export. Utilisez Chrome ou Edge.");
    } finally {
      setExporting(false);
    }
  };

  // ---- Étape 4 : hooks + shorts ----
  const analyzeHooks = async () => {
    setHooksLoading(true);
    try {
      const res = await fetch("/api/production/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: scriptRaw, sceneCount: scenes.length }),
      });
      const data = await res.json();
      setHooks(data.hooks ?? []);
      setHooksDemo(!!data.demo);
    } finally {
      setHooksLoading(false);
    }
  };

  const exportShort = async (hookIndex: number) => {
    const hook = hooks[hookIndex];
    if (!hook) return;
    setShortExporting(hookIndex);
    setShortPct(0);
    try {
      const subset = hook.scenes
        .map((n) => scenes[n - 1])
        .filter(Boolean)
        .map((s, i) => ({
          caption: i === 0 ? hook.hook : s.audio,
          imageUrl: s.imageUrl,
          videoUrl: s.videoUrl,
        }));
      if (subset.length === 0) return;
      const { blob, ext } = await exportMontage({
        scenes: subset,
        vertical: true,
        overlayText: hook.ecran,
        onProgress: (pct) => setShortPct(pct),
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `short-${hookIndex + 1}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Échec de l'export du Short.");
    } finally {
      setShortExporting(null);
    }
  };

  const assetsReady = scenes.length > 0 && scenes.every((s) => s.imageUrl);

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon animate-pulse-glow">
              <Clapperboard size={21} />
            </span>
            Studio de <span className="neon-text">Production</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Le <strong>Pipeline Unifié</strong> en action : une idée brute entre,
            une vidéo montée + ses Shorts sortent. Script 2 colonnes, images IA,
            voix off, montage automatique et recoupage viral.
          </p>
        </motion.div>

        {/* ---- Stepper ---- */}
        <div className="mt-7 grid gap-2 sm:grid-cols-4">
          {STEPS.map((s) => {
            const unlocked = s.n <= maxStep;
            return (
              <button
                key={s.n}
                onClick={() => unlocked && setStep(s.n)}
                disabled={!unlocked}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  step === s.n
                    ? "btn-neon"
                    : unlocked
                      ? "glass hover:scale-[1.01]"
                      : "glass opacity-40"
                }`}
              >
                <s.icon size={17} />
                <div>
                  <div className="text-[10px] font-bold tracking-widest opacity-70">
                    ÉTAPE {s.n}
                  </div>
                  <div className="text-sm font-semibold">{s.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ================= ÉTAPE 1 ================= */}
        {step === 1 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="glass neon-border h-fit rounded-2xl p-6">
              <label className="mb-1.5 block text-sm font-semibold">💡 Idée brute</label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                placeholder="Ex : les 5 outils IA qui remplacent un monteur vidéo en 2026…"
                className="w-full resize-y rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />

              <label className="mb-1.5 mt-4 block text-sm font-semibold">🎬 Format</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormat("youtube")}
                  className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    format === "youtube" ? "btn-neon" : "glass"
                  }`}
                >
                  <Youtube size={16} /> YouTube 16:9
                </button>
                <button
                  onClick={() => setFormat("short")}
                  className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                    format === "short" ? "btn-neon" : "glass"
                  }`}
                >
                  <Smartphone size={16} /> Short 9:16
                </button>
              </div>

              <label className="mb-1.5 mt-4 block text-sm font-semibold">🎙️ Ton (optionnel)</label>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="énergique, pédagogue, polémique…"
                className="w-full rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />

              <button
                onClick={generateScript}
                disabled={generating || !idea.trim()}
                className="btn-neon mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? "Écriture en direct…" : "Générer le script 2 colonnes"}
              </button>
            </div>

            <div className="glass neon-border rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">
                  Script de production{" "}
                  {scenes.length > 0 && (
                    <span className="text-sm text-muted">
                      — {scenes.length} scènes · ~{totalDuration}s
                    </span>
                  )}
                </h2>
                {scenes.length > 0 && !generating && (
                  <button
                    onClick={() => goTo(2)}
                    className="btn-neon flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    Produire les assets <ChevronRight size={15} />
                  </button>
                )}
              </div>

              {scenes.length === 0 ? (
                <div className="grid min-h-[320px] place-items-center text-center">
                  <p className={`max-w-sm text-sm text-muted ${generating ? "stream-caret" : ""}`}>
                    {generating
                      ? "L'IA écrit votre script scène par scène…"
                      : "Le script s'affichera ici en deux colonnes : AUDIO (à dire) et VISUEL (prompt image), scène par scène."}
                  </p>
                </div>
              ) : (
                <div className="mt-4 max-h-[62vh] space-y-3 overflow-y-auto pr-2">
                  {scenes.map((s, i) => (
                    <div key={i} className="glass rounded-xl p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-md btn-neon px-2 py-0.5 font-mono text-[10px] font-bold">
                          SCÈNE {i + 1}
                        </span>
                        <span className="text-[10px] text-muted">
                          ~{sceneDuration(s.audio).toFixed(1)}s
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-[10px] font-bold tracking-widest text-neon-cyan">🎙️ AUDIO</div>
                          <p className="mt-1 text-sm">{s.audio}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-widest text-neon-violet">🎨 VISUEL</div>
                          <p className="mt-1 font-mono text-xs text-muted">{s.visuel}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ÉTAPE 2 ================= */}
        {step === 2 && (
          <div className="mt-6 space-y-6">
            <div className="glass neon-border flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
              <div>
                <h2 className="font-display font-semibold">Images des scènes</h2>
                <p className="text-xs text-muted">
                  Chaque prompt VISUEL devient une image ({vertical ? "9:16" : "16:9"}).
                  Génération séquentielle pour préserver vos crédits.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={generateAllImages}
                  disabled={batchRunning || assetsReady}
                  className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {batchRunning ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                  {assetsReady ? "Toutes les images sont prêtes ✓" : batchRunning ? "Génération…" : "Tout générer"}
                </button>
                {assetsReady && (
                  <button
                    onClick={() => goTo(3)}
                    className="btn-neon flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Passer au montage <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scenes.map((s, i) => (
                <div key={i} className="glass neon-border overflow-hidden rounded-2xl">
                  <div className={`relative ${vertical ? "aspect-[9/16] max-h-64" : "aspect-video"} w-full bg-black/40`}>
                    {s.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt={`Scène ${i + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        {s.imgStatus === "loading" ? (
                          <Loader2 size={22} className="animate-spin text-neon-violet" />
                        ) : (
                          <button
                            onClick={() => generateImage(i)}
                            className="glass flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold hover:scale-105"
                          >
                            <Sparkles size={13} /> Générer l'image
                          </button>
                        )}
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                      SCÈNE {i + 1} {s.imgStatus === "demo" && "· démo"}
                    </span>
                    {s.imageUrl && (
                      <button
                        onClick={() => generateImage(i)}
                        title="Régénérer"
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/70 text-white hover:scale-110"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => speakScene(s.audio)}
                        title="Écouter (TTS)"
                        className="glass mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg hover:scale-110"
                      >
                        <Volume2 size={12} />
                      </button>
                      <p className="line-clamp-3 text-xs text-muted">{s.audio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plans vidéo IA (optionnel) */}
            <div className="glass neon-border rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 font-display font-semibold">
                    <Film size={16} className="text-neon-cyan" /> Plans vidéo IA (optionnel)
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Anime chaque image en vrai plan vidéo (Runway Gen-3) au lieu de
                    l'effet Ken Burns. Fonction premium — le rendu prend ~1-2 min par
                    scène. Sans clé : le montage garde les images animées.
                  </p>
                </div>
                <button
                  onClick={generateAllVideos}
                  disabled={batchVideo || !assetsReady}
                  className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {batchVideo ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
                  {batchVideo ? "Animation en cours…" : "Animer toutes les scènes"}
                </button>
              </div>

              {scenes.some((s) => s.vidStatus !== "idle") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {scenes.map((s, i) => (
                    <span
                      key={i}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        s.vidStatus === "done"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : s.vidStatus === "processing"
                            ? "bg-cyan-500/15 text-cyan-400"
                            : s.vidStatus === "error"
                              ? "bg-red-500/15 text-red-400"
                              : "glass text-muted"
                      }`}
                    >
                      S{i + 1}{" "}
                      {s.vidStatus === "done"
                        ? "✓"
                        : s.vidStatus === "processing"
                          ? "…"
                          : s.vidStatus === "error"
                            ? "✕"
                            : s.vidStatus === "demo"
                              ? "démo"
                              : ""}
                    </span>
                  ))}
                </div>
              )}
              {videoMsg && <p className="mt-2 text-xs text-muted">{videoMsg}</p>}
            </div>

            {/* Voix off */}
            <div className="glass neon-border rounded-2xl p-5">
              <h2 className="font-display font-semibold">🎙️ Voix off (optionnel)</h2>
              <p className="mt-1 text-xs text-muted">
                Générez une voix off IA ultra-réaliste (ElevenLabs) pour tout le
                script, ou enregistrez / importez la vôtre — la piste sera muxée
                dans la vidéo finale.
              </p>

              {/* Voix off IA ElevenLabs */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="rounded-xl glass px-3 py-2.5 text-sm outline-none"
                >
                  <option value="charlotte">Charlotte (F)</option>
                  <option value="antoni">Antoni (H)</option>
                  <option value="rachel">Rachel (F)</option>
                </select>
                <button
                  onClick={generateAIVoice}
                  disabled={voiceGen || scenes.length === 0}
                  className="btn-neon flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {voiceGen ? <Loader2 size={15} className="animate-spin" /> : <Volume2 size={15} />}
                  {voiceGen ? "Génération de la voix…" : "Générer la voix off IA"}
                </button>
              </div>
              {voiceNote && <p className="mt-2 text-xs text-muted">{voiceNote}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={toggleRecord}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    recording ? "animate-pulse bg-red-500 text-white" : "glass hover:scale-[1.02]"
                  }`}
                >
                  {recording ? <Square size={15} /> : <Mic size={15} />}
                  {recording ? "Arrêter" : "Enregistrer ma voix"}
                </button>
                <label className="glass flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold hover:scale-[1.02]">
                  <Upload size={15} /> Importer un audio
                  <input type="file" accept="audio/*" onChange={onImportAudio} className="hidden" />
                </label>
                {audioUrl && (
                  <div className="flex items-center gap-2">
                    <audio controls src={audioUrl} className="h-9 max-w-[220px]" />
                    <button
                      onClick={clearVoice}
                      title="Supprimer / refaire la voix off"
                      className="glass grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar présentateur (lip-sync) */}
            <AvatarStep
              scriptText={scenes.map((s) => s.audio).join(". ")}
              onReadyVideo={setAvatarVideoUrl}
            />
          </div>
        )}

        {/* ================= ÉTAPE 3 ================= */}
        {step === 3 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="glass neon-border rounded-2xl p-6">
              <h2 className="font-display font-semibold">Montage automatique</h2>
              <p className="mt-1 text-xs text-muted">
                Assemblage des {scenes.length} scènes : effet Ken Burns sur chaque
                image, sous-titres dynamiques synchronisés (colonne AUDIO), fondus
                enchaînés, {useVoiceover && audioBlob ? "votre voix off muxée" : "vidéo muette (ajoutez une voix à l'étape 2)"}
                {usePresenter && avatarVideoUrl ? ", avatar présentateur incrusté" : ""}.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {scenes.slice(0, 12).map((s, i) => (
                  <div key={i} className={`overflow-hidden rounded-lg ${vertical ? "aspect-[9/16]" : "aspect-video"}`}>
                    {s.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "SCÈNES", value: scenes.length },
                  { label: "DURÉE", value: `~${totalDuration}s` },
                  { label: "FORMAT", value: vertical ? "720×1280" : "1280×720" },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-xl py-3">
                    <div className="text-[10px] font-bold tracking-widest text-muted">{s.label}</div>
                    <div className="mt-1 font-mono text-lg font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass neon-border h-fit rounded-2xl p-6">
              <h2 className="text-center font-display font-semibold">🎬 Export final</h2>

              {/* Éléments optionnels à intégrer à la vidéo */}
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">À intégrer (optionnel)</p>
                <label className={`flex items-center justify-between gap-2 rounded-xl glass px-3 py-2.5 text-sm ${!audioBlob ? "opacity-50" : ""}`}>
                  <span className="flex items-center gap-2"><Volume2 size={14} /> Voix off</span>
                  <input
                    type="checkbox"
                    checked={useVoiceover && !!audioBlob}
                    disabled={!audioBlob}
                    onChange={(e) => setUseVoiceover(e.target.checked)}
                    className="h-4 w-4 accent-violet-500"
                  />
                </label>
                <label className={`flex items-center justify-between gap-2 rounded-xl glass px-3 py-2.5 text-sm ${!avatarVideoUrl ? "opacity-50" : ""}`}>
                  <span className="flex items-center gap-2"><UserSquare2 size={14} /> Avatar présentateur (incrustation)</span>
                  <input
                    type="checkbox"
                    checked={usePresenter && !!avatarVideoUrl}
                    disabled={!avatarVideoUrl}
                    onChange={(e) => setUsePresenter(e.target.checked)}
                    className="h-4 w-4 accent-violet-500"
                  />
                </label>
                <p className="text-[11px] text-muted">
                  {avatarVideoUrl
                    ? "Cochez ce que vous voulez intégrer à la vidéo finale."
                    : "Créez un avatar parlant à l'étape 2 pour pouvoir l'incruster ici."}
                </p>
              </div>

              <button
                onClick={exportVideo}
                disabled={exporting}
                className="btn-neon mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-60"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {exporting ? exportLabel || "Export…" : "Exporter la vidéo MP4"}
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
                Rendu 100 % dans votre navigateur (canvas + ffmpeg.wasm). Aucun
                logiciel de montage requis.
              </p>
              {(exportedOnce || !exporting) && (
                <button
                  onClick={() => goTo(4)}
                  className="glass neon-border mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold hover:scale-[1.01]"
                >
                  <Scissors size={15} /> Décliner en Shorts <ChevronRight size={15} />
                </button>
              )}

              {/* Partage / publication (déplacé depuis le Studio) */}
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Share2 size={13} className="text-neon-cyan" /> Publier / partager
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareX}
                    className="glass flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium hover:scale-[1.02]"
                  >
                    <Twitter size={14} /> X
                  </button>
                  <button
                    onClick={shareTikTok}
                    className="glass flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium hover:scale-[1.02]"
                  >
                    <Music2 size={14} /> TikTok
                  </button>
                  <button
                    onClick={shareYouTube}
                    className="glass flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium hover:scale-[1.02]"
                  >
                    <Youtube size={14} /> YouTube
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= ÉTAPE 4 ================= */}
        {step === 4 && (
          <div className="mt-6 space-y-6">
            <div className="glass neon-border flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
              <div>
                <h2 className="font-display font-semibold">Recoupage intelligent</h2>
                <p className="text-xs text-muted">
                  L'IA analyse votre script et isole les 3 moments au plus fort
                  potentiel viral — chacun devient un Short 9:16 sous-titré.
                  {hooksDemo && (
                    <span className="ml-1 font-semibold text-yellow-400">Mode démo.</span>
                  )}
                </p>
              </div>
              <button
                onClick={analyzeHooks}
                disabled={hooksLoading}
                className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {hooksLoading ? <Loader2 size={15} className="animate-spin" /> : <Scissors size={15} />}
                {hooks.length ? "Ré-analyser" : "Détecter les hooks viraux"}
              </button>
            </div>

            {hooks.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {hooks.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass neon-border rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-[10px] font-extrabold text-white">
                        SCORE {h.score}/10
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        scènes {h.scenes.join(" + ")}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display font-bold">{h.titre}</h3>
                    <p className="mt-2 text-sm neon-text font-semibold">« {h.hook} »</p>
                    <p className="mt-1 text-xs text-muted">
                      Texte à l'écran : <strong className="text-yellow-400">{h.ecran}</strong>
                    </p>
                    <button
                      onClick={() => exportShort(i)}
                      disabled={shortExporting !== null}
                      className="btn-neon mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      {shortExporting === i ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> {shortPct}%
                        </>
                      ) : (
                        <>
                          <Smartphone size={14} /> Exporter le Short 9:16
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {hooks.length > 0 && (
              <div className="glass rounded-2xl p-5 text-center text-sm text-muted">
                <Check size={16} className="mx-auto mb-1 text-neon-lime" />
                Pipeline terminé : 1 vidéo {vertical ? "verticale" : "longue"} + {hooks.length} Shorts.
                Créez les miniatures dans l'onglet <strong>Miniatures</strong>, ou faites
                présenter le script par votre <strong>Avatar</strong>.
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
