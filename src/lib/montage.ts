"use client";

// Moteur de montage du Studio de Production : assemble les scènes
// (image IA + légende AUDIO) en une vidéo — effet Ken Burns, sous-titres
// dynamiques, voix off muxée — puis exporte en MP4 (ffmpeg.wasm).

import { transcodeToMp4 } from "./exportVideo";

export type MontageScene = {
  caption: string;
  imageUrl?: string | null; // dataURL de l'image IA (ou null → fond procédural)
};

export type MontageOptions = {
  scenes: MontageScene[];
  vertical: boolean; // true = 720x1280 (Short), false = 1280x720 (YouTube)
  audioBlob?: Blob | null;
  overlayText?: string; // texte à l'écran permanent (hooks des Shorts)
  onProgress?: (pct: number, label: string) => void;
};

export function sceneDuration(caption: string): number {
  return Math.max(2.4, caption.split(/\s+/).filter(Boolean).length * 0.38);
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Visuel procédural déterministe par index de scène (mode démo)
function proceduralScene(index: number, W: number, H: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const rand = (n: number) => {
    // pseudo-aléatoire déterministe
    const x = Math.sin(index * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  ctx.fillStyle = "#070214";
  ctx.fillRect(0, 0, W, H);
  const hues = [190, 265, 300, 15, 330];
  for (let i = 0; i < 12; i++) {
    const x = rand(i) * W;
    const y = rand(i + 50) * H;
    const r = 120 + rand(i + 100) * (W / 3);
    const hue = hues[(index + i) % hues.length];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue}, 95%, 60%, ${0.15 + rand(i + 200) * 0.3})`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return c;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out;
}

export async function exportMontage(
  opts: MontageOptions
): Promise<{ blob: Blob; ext: "mp4" | "webm"; duration: number }> {
  const { scenes, vertical, audioBlob, overlayText, onProgress } = opts;
  const W = vertical ? 720 : 1280;
  const H = vertical ? 1280 : 720;
  const FPS = 30;

  onProgress?.(2, "Préparation des visuels…");

  // Précharge les visuels (image IA ou fond procédural)
  const visuals: (HTMLImageElement | HTMLCanvasElement)[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const url = scenes[i].imageUrl;
    const img = url ? await loadImage(url) : null;
    visuals.push(img ?? proceduralScene(i, W, H));
  }

  const durations = scenes.map((s) => sceneDuration(s.caption));
  const total = durations.reduce((a, b) => a + b, 0) + 0.6;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(FPS);

  // Voix off muxée
  let audioCtx: AudioContext | null = null;
  if (audioBlob) {
    try {
      audioCtx = new AudioContext();
      const buf = await audioCtx.decodeAudioData(await audioBlob.arrayBuffer());
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      src.start();
    } catch {
      /* audio illisible : vidéo muette */
    }
  }

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 7_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const drawFrame = (t: number) => {
    // scène courante
    let acc = 0;
    let idx = 0;
    for (let i = 0; i < durations.length; i++) {
      if (t < acc + durations[i]) {
        idx = i;
        break;
      }
      acc += durations[i];
      idx = i;
    }
    const local = Math.min(1, (t - acc) / durations[idx]); // 0→1 dans la scène
    const visual = visuals[idx];

    // Ken Burns : zoom lent 1.0 → 1.09, léger pan alterné
    const zoom = 1 + local * 0.09;
    const panX = (idx % 2 === 0 ? 1 : -1) * local * 0.03 * W;
    const vw = (visual as HTMLImageElement).width || W;
    const vh = (visual as HTMLImageElement).height || H;
    const scale = Math.max(W / vw, H / vh) * zoom;
    const dw = vw * scale;
    const dh = vh * scale;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(visual, (W - dw) / 2 + panX, (H - dh) / 2, dw, dh);

    // fondu enchaîné en début de scène
    if (local < 0.12) {
      ctx.fillStyle = `rgba(0,0,0,${1 - local / 0.12})`;
      ctx.fillRect(0, 0, W, H);
    }

    // dégradé bas pour la lisibilité des sous-titres
    const grad = ctx.createLinearGradient(0, H * 0.62, 0, H);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, "rgba(0,0,0,.82)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    // texte à l'écran permanent (Shorts)
    ctx.textAlign = "center";
    if (overlayText) {
      ctx.font = `900 ${vertical ? 46 : 52}px 'Segoe UI', sans-serif`;
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(0,0,0,.85)";
      ctx.strokeText(overlayText, W / 2, vertical ? 150 : 110);
      ctx.fillStyle = "#fde047";
      ctx.shadowColor = "rgba(0,0,0,.8)";
      ctx.shadowBlur = 14;
      ctx.fillText(overlayText, W / 2, vertical ? 150 : 110);
      ctx.shadowBlur = 0;
    }

    // sous-titre dynamique (la légende AUDIO de la scène)
    ctx.font = `bold ${vertical ? 40 : 42}px 'Segoe UI', sans-serif`;
    const lines = wrapText(ctx, scenes[idx].caption, W - (vertical ? 110 : 260));
    const lh = vertical ? 52 : 54;
    const baseY = H - (vertical ? 200 : 120) - (lines.length - 1) * lh;
    lines.forEach((l, i) => {
      const y = baseY + i * lh;
      ctx.lineWidth = 9;
      ctx.strokeStyle = "rgba(0,0,0,.8)";
      ctx.strokeText(l, W / 2, y);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(167,139,250,.7)";
      ctx.shadowBlur = 12;
      ctx.fillText(l, W / 2, y);
      ctx.shadowBlur = 0;
    });

    // barre de progression + watermark
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(0, H - 8, W, 8);
    const pg = ctx.createLinearGradient(0, 0, W, 0);
    pg.addColorStop(0, "#22d3ee");
    pg.addColorStop(1, "#e879f9");
    ctx.fillStyle = pg;
    ctx.fillRect(0, H - 8, W * Math.min(1, t / total), 8);

    ctx.font = "600 22px 'Segoe UI', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.fillText("ViralRepo.AI ⚡", W / 2, H - 22);
  };

  const webmBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.start(250);
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (t >= total) {
        drawFrame(total - 0.01);
        recorder.stop();
        audioCtx?.close().catch(() => {});
        return;
      }
      drawFrame(t);
      opts.onProgress?.(3 + Math.round((t / total) * 57), "Montage en cours…");
      requestAnimationFrame(tick);
    };
    tick();
  });

  const out = await transcodeToMp4(webmBlob, onProgress);
  return { ...out, duration: Math.round(total) };
}
