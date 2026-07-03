"use client";

// Générateur de miniatures YouTube/posts (1280x720) : titre choc,
// dégradés néon, emoji, badge — export PNG en un clic.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Download, Sparkles, Upload, Loader2, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const GRADIENTS = [
  { name: "Néon Violet", stops: ["#1e1b4b", "#6d28d9", "#c026d3"] },
  { name: "Cyber Cyan", stops: ["#042f2e", "#0e7490", "#22d3ee"] },
  { name: "Feu Viral", stops: ["#450a0a", "#ea580c", "#facc15"] },
  { name: "Matrix", stops: ["#052e16", "#15803d", "#a3e635"] },
  { name: "Minuit", stops: ["#020617", "#1e293b", "#475569"] },
];

const EMOJIS = ["🔥", "🚀", "🤯", "⚡", "💥", "🤖", "👀", "💸"];

// Fond procédural "IA locale" : blobs néon aléatoires (mode démo sans clé Gemini)
function proceduralBackground(): string {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 720;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#070214";
  ctx.fillRect(0, 0, 1280, 720);
  const hues = [190, 265, 300, 15, 330];
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * 1280;
    const y = Math.random() * 720;
    const r = 120 + Math.random() * 320;
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue}, 95%, 60%, ${0.16 + Math.random() * 0.3})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);
  }
  // filaments lumineux
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = `hsla(${hues[i % hues.length]}, 90%, 65%, ${0.05 + Math.random() * 0.15})`;
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.beginPath();
    let x = Math.random() * 1280;
    let y = Math.random() * 720;
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (Math.random() - 0.5) * 500;
      y += (Math.random() - 0.5) * 320;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c.toDataURL("image/png");
}

export default function ThumbnailsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState("CE REPO IA EXPLOSE 🔥");
  const [subtitle, setSubtitle] = useState("+1500 étoiles / jour");
  const [gradient, setGradient] = useState(0);
  const [emoji, setEmoji] = useState("🔥");
  const [badge, setBadge] = useState("EXPLOSIF");

  // Fond image : créé par l'IA ou importé
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const setBackgroundFromDataUrl = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = dataUrl;
  };

  const generateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiNote("");
    try {
      const res = await fetch("/api/thumbnail-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.image) {
        setBackgroundFromDataUrl(data.image);
        setAiNote("✨ Fond généré par Gemini !");
      } else if (data.demo) {
        setBackgroundFromDataUrl(proceduralBackground());
        setAiNote("Mode démo : fond néon procédural (ajoutez GEMINI_API_KEY pour la vraie génération IA).");
      } else {
        setAiNote(data.error || "Erreur de génération.");
      }
    } catch {
      setAiNote("Erreur réseau — réessayez.");
    } finally {
      setAiLoading(false);
    }
  };

  const onImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBackgroundFromDataUrl(reader.result as string);
    reader.readAsDataURL(f);
    setAiNote("🖼️ Image importée comme fond.");
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 1280;
    const H = 720;

    if (bgImage) {
      // fond image (IA ou importée) en mode "cover"
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const dw = bgImage.width * scale;
      const dh = bgImage.height * scale;
      ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
      // voile sombre pour la lisibilité du texte
      const ov = ctx.createLinearGradient(0, 0, W, 0);
      ov.addColorStop(0, "rgba(0,0,0,.62)");
      ov.addColorStop(0.6, "rgba(0,0,0,.30)");
      ov.addColorStop(1, "rgba(0,0,0,.12)");
      ctx.fillStyle = ov;
      ctx.fillRect(0, 0, W, H);
    } else {
      // fond dégradé
      const g = ctx.createLinearGradient(0, 0, W, H);
      const stops = GRADIENTS[gradient].stops;
      stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // grille futuriste
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // halo central
      const rg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 520);
      rg.addColorStop(0, "rgba(255,255,255,.14)");
      rg.addColorStop(1, "transparent");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    // emoji géant (masqué quand une image sert de fond)
    if (!bgImage) {
      ctx.font = "220px 'Segoe UI Emoji', sans-serif";
      ctx.textAlign = "center";
      ctx.save();
      ctx.translate(W - 220, H / 2 + 70);
      ctx.rotate(-0.12);
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    }

    // badge
    if (badge.trim()) {
      ctx.font = "bold 42px 'Segoe UI', sans-serif";
      const bt = `🔥 ${badge.toUpperCase()}`;
      const bw = ctx.measureText(bt).width + 60;
      const bg2 = ctx.createLinearGradient(70, 70, 70 + bw, 70);
      bg2.addColorStop(0, "#f97316");
      bg2.addColorStop(1, "#ef4444");
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.roundRect(70, 70, bw, 72, 36);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(bt, 100, 121);
    }

    // titre
    ctx.textAlign = "left";
    ctx.font = "900 92px 'Segoe UI', sans-serif";
    const words = title.split(" ");
    const linesArr: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 760 && line) {
        linesArr.push(line);
        line = w;
      } else line = test;
    }
    if (line) linesArr.push(line);

    let y = H / 2 - ((linesArr.length - 1) * 104) / 2 + 20;
    for (const l of linesArr) {
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.strokeText(l, 80, y);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(34,211,238,.9)";
      ctx.shadowBlur = 26;
      ctx.fillText(l, 80, y);
      ctx.shadowBlur = 0;
      y += 104;
    }

    // sous-titre
    if (subtitle.trim()) {
      ctx.font = "bold 48px 'Segoe UI', sans-serif";
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "rgba(0,0,0,.9)";
      ctx.shadowBlur = 12;
      ctx.fillText(subtitle, 82, y + 16);
      ctx.shadowBlur = 0;
    }

    // watermark
    ctx.font = "600 30px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.textAlign = "right";
    ctx.fillText("ViralRepo.AI ⚡", W - 40, H - 36);
  }, [title, subtitle, gradient, emoji, badge, bgImage]);

  useEffect(() => {
    draw();
  }, [draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "miniature-viralrepo.png";
    a.click();
  };

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon">
              <ImageIcon size={21} />
            </span>
            Miniatures <span className="neon-text">percutantes</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Créez la miniature qui fera cliquer — format YouTube 1280×720, export PNG.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="glass neon-border h-fit space-y-4 rounded-2xl p-5">
            {/* ---- Fond créé par l'IA / import d'image ---- */}
            <div className="neon-border rounded-xl p-3.5">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles size={14} className="text-neon-cyan" /> Fond créé par l'IA
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={2}
                placeholder="Décrivez le fond : « robot néon codant dans une salle serveur cyberpunk »…"
                className="w-full resize-none rounded-lg glass px-3 py-2 text-xs outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={generateAI}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="btn-neon flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {aiLoading ? "Génération…" : "Générer avec l'IA"}
                </button>
                <label className="glass flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold hover:scale-[1.02]">
                  <Upload size={13} /> Importer
                  <input type="file" accept="image/*" onChange={onImportImage} className="hidden" />
                </label>
              </div>
              {bgImage && (
                <button
                  onClick={() => {
                    setBgImage(null);
                    setAiNote("");
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  <X size={12} /> Retirer le fond image
                </button>
              )}
              {aiNote && <p className="mt-2 text-[11px] text-muted">{aiNote}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Titre choc</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Sous-titre</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Badge</label>
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ambiance</label>
              <div className="flex flex-wrap gap-2">
                {GRADIENTS.map((g, i) => (
                  <button
                    key={g.name}
                    onClick={() => setGradient(i)}
                    title={g.name}
                    className={`h-9 w-9 rounded-lg transition-transform ${
                      gradient === i ? "ring-2 ring-white scale-110" : "hover:scale-105"
                    }`}
                    style={{ background: `linear-gradient(135deg, ${g.stops.join(",")})` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition-transform ${
                      emoji === e ? "glass ring-2 ring-violet-500 scale-110" : "hover:scale-110"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={download}
              className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold"
            >
              <Download size={16} /> Télécharger le PNG
            </button>
          </div>

          <div className="glass neon-border rounded-2xl p-5">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full rounded-xl shadow-[0_0_40px_-10px_rgba(139,92,246,.6)]"
            />
          </div>
        </div>
      </main>
    </>
  );
}
