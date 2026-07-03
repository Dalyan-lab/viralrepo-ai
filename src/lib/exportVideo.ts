"use client";

// Export vidéo côté client : dessine le Reel sur un <canvas> 720x1280,
// capture le flux avec MediaRecorder (webm), puis transcode en MP4
// via ffmpeg.wasm. Aucune installation, aucun montage.

export type ExportOptions = {
  lines: string[];
  repoName: string;
  badge: string;
  audioBlob?: Blob | null; // voix importée ou enregistrée, muxée dans le MP4
  onProgress?: (pct: number, label: string) => void;
};

export function lineDurations(lines: string[]): number[] {
  // Durée proportionnelle au nombre de mots (rythme lecture voix off)
  return lines.map((l) => Math.max(1.8, l.split(/\s+/).filter(Boolean).length * 0.38));
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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  total: number,
  lines: string[],
  durations: number[],
  repoName: string,
  badge: string
) {
  // --- fond dégradé animé ---
  const g = ctx.createLinearGradient(0, 0, W, H);
  const shift = (Math.sin(t * 0.35) + 1) / 2;
  g.addColorStop(0, `hsl(${230 + shift * 20}, 65%, 8%)`);
  g.addColorStop(0.5, `hsl(${265 + shift * 15}, 60%, 14%)`);
  g.addColorStop(1, `hsl(${300 + shift * 10}, 55%, 10%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // orbes lumineux
  for (const [ox, oy, r, hue, speed] of [
    [0.2, 0.25, 260, 190, 0.5],
    [0.85, 0.6, 300, 280, 0.35],
    [0.4, 0.85, 220, 320, 0.6],
  ] as const) {
    const x = ox * W + Math.sin(t * speed) * 40;
    const y = oy * H + Math.cos(t * speed * 0.8) * 30;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.22)`);
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  // --- badge en haut ---
  ctx.textAlign = "center";
  const badgeText = `🔥 ${badge}`;
  ctx.font = "bold 34px 'Segoe UI', sans-serif";
  const bw = ctx.measureText(badgeText).width + 56;
  const bx = W / 2 - bw / 2;
  const by = 120;
  const bg2 = ctx.createLinearGradient(bx, by, bx + bw, by);
  bg2.addColorStop(0, "#f97316");
  bg2.addColorStop(1, "#ef4444");
  ctx.fillStyle = bg2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 62, 31);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(badgeText, W / 2, by + 43);

  // --- nom du repo ---
  ctx.font = "bold 44px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#7dd3fc";
  ctx.shadowColor = "rgba(34,211,238,.8)";
  ctx.shadowBlur = 24;
  ctx.fillText(repoName, W / 2, 260);
  ctx.shadowBlur = 0;

  // --- légende courante (karaoké) ---
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
  const line = lines[idx] ?? "";
  const lineT = Math.min(1, (t - acc) / 0.35); // apparition rapide

  ctx.font = "bold 52px 'Segoe UI', sans-serif";
  const wrapped = wrapText(ctx, line, W - 140);
  const lh = 68;
  const startY = H / 2 - ((wrapped.length - 1) * lh) / 2;

  ctx.save();
  ctx.globalAlpha = lineT;
  ctx.translate(0, (1 - lineT) * 22);
  wrapped.forEach((w, i) => {
    const y = startY + i * lh;
    // contour pour lisibilité (style sous-titres Reels)
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(0,0,0,.75)";
    ctx.strokeText(w, W / 2, y);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(167,139,250,.9)";
    ctx.shadowBlur = 18;
    ctx.fillText(w, W / 2, y);
    ctx.shadowBlur = 0;
  });
  ctx.restore();

  // --- compteur de lignes + progression ---
  ctx.font = "500 28px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText(`${idx + 1} / ${lines.length}`, W / 2, H - 170);

  const pw = W - 160;
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.roundRect(80, H - 130, pw, 10, 5);
  ctx.fill();
  const pg = ctx.createLinearGradient(80, 0, 80 + pw, 0);
  pg.addColorStop(0, "#22d3ee");
  pg.addColorStop(0.5, "#a78bfa");
  pg.addColorStop(1, "#e879f9");
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(80, H - 130, pw * Math.min(1, t / total), 10, 5);
  ctx.fill();

  // --- watermark ---
  ctx.font = "600 26px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.4)";
  ctx.fillText("créé avec ViralRepo.AI ⚡", W / 2, H - 64);
}

export async function exportReelVideo(
  opts: ExportOptions
): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  const { lines, repoName, badge, audioBlob, onProgress } = opts;
  const W = 720;
  const H = 1280;
  const FPS = 30;

  const durations = lineDurations(lines);
  const total = durations.reduce((a, b) => a + b, 0) + 0.8;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(FPS);

  // Mux de la voix (importée / enregistrée) dans la vidéo
  let audioCtx: AudioContext | null = null;
  if (audioBlob) {
    try {
      audioCtx = new AudioContext();
      const buf = await audioCtx.decodeAudioData(await audioBlob.arrayBuffer());
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      src.start();
    } catch {
      // audio illisible — on continue sans son
    }
  }

  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const webmBlob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.start(250);

    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (t >= total) {
        drawFrame(ctx, W, H, total, total, lines, durations, repoName, badge);
        recorder.stop();
        audioCtx?.close().catch(() => {});
        return;
      }
      drawFrame(ctx, W, H, t, total, lines, durations, repoName, badge);
      onProgress?.(Math.round((t / total) * 60), "Enregistrement de l'aperçu…");
      requestAnimationFrame(tick);
    };
    tick();
  });

  return transcodeToMp4(webmBlob, onProgress);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout`)), ms)
    ),
  ]);
}

/** Transcode un webm en MP4 via ffmpeg.wasm ; repli webm si indisponible. */
export async function transcodeToMp4(
  webmBlob: Blob,
  onProgress?: (pct: number, label: string) => void
): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  try {
    onProgress?.(65, "Chargement du moteur MP4 (ffmpeg.wasm)…");
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    // Les petits fichiers (worker + core ESM, qui s'importent en relatif) sont
    // auto-hébergés dans /public/ffmpeg et versionnés dans git → présents en
    // production. Seul le binaire .wasm (31 Mo, exclu de git) est chargé depuis
    // le CDN jsDelivr : l'export MP4 fonctionne donc aussi sur Vercel, sans
    // committer un gros binaire. En local, un fichier .wasm auto-hébergé peut
    // exister ; on privilégie quand même le CDN pour un comportement identique
    // partout.
    const origin = window.location.origin;
    await withTimeout(
      ffmpeg.load({
        coreURL: `${origin}/ffmpeg/ffmpeg-core.js`,
        wasmURL:
          "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm",
        classWorkerURL: `${origin}/ffmpeg/worker.js`,
      }),
      45_000,
      "ffmpeg load"
    );

    ffmpeg.on("progress", ({ progress }) => {
      // Le webm issu de MediaRecorder n'a pas de durée dans ses métadonnées :
      // ffmpeg renvoie alors des ratios aberrants (négatifs/énormes) → clamp.
      const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
      onProgress?.(70 + Math.round(p * 28), "Transcodage MP4…");
    });

    await ffmpeg.writeFile("in.webm", await fetchFile(webmBlob));
    await withTimeout(
      ffmpeg.exec([
        "-i", "in.webm",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "out.mp4",
      ]),
      300_000,
      "ffmpeg exec"
    );
    const data = (await ffmpeg.readFile("out.mp4")) as Uint8Array;
    onProgress?.(100, "MP4 prêt !");
    const bytes = new Uint8Array(data); // copie vers un ArrayBuffer standard
    return { blob: new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" }), ext: "mp4" };
  } catch {
    // ffmpeg indisponible (hors-ligne…) : on livre le webm, lisible partout
    onProgress?.(100, "Vidéo prête (format WebM) !");
    return { blob: webmBlob, ext: "webm" };
  }
}
