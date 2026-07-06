import { prisma } from "./db";
import { replicateConfigured, replicateRun, urlToDataUrl, MODELS } from "./replicate";

// Moteur Montageiv IA : crédits partagés + générateurs des modules.
// Chaque module réutilise les intégrations existantes (Gemini, ElevenLabs,
// Runway, D-ID) avec un repli démo honnête quand la clé manque.

export type ModuleId = "image" | "video" | "musique" | "voix" | "avatar" | "redacteur";

export const MODULE_COSTS: Record<ModuleId, number> = {
  image: 4,
  video: 20,
  musique: 10,
  voix: 2,
  avatar: 15,
  redacteur: 1,
};

// Allocation mensuelle de crédits selon le plan d'abonnement.
export const PLAN_CREDITS: Record<string, number> = {
  decouverte: 50,
  createur: 500,
  studio: 2000,
};

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export async function getCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true, creditsUsed: true, creditsPeriodStart: true },
  });
  if (!user) return { used: 0, allowance: 0, remaining: 0, plan: "decouverte" };

  const planActive =
    user.plan !== "decouverte" && (!user.planExpiresAt || user.planExpiresAt > new Date());
  const plan = planActive ? user.plan : "decouverte";
  const allowance = PLAN_CREDITS[plan] ?? PLAN_CREDITS.decouverte;

  // Réinitialisation mensuelle glissante
  let used = user.creditsUsed;
  if (Date.now() - user.creditsPeriodStart.getTime() > PERIOD_MS) {
    used = 0;
    await prisma.user.update({
      where: { id: userId },
      data: { creditsUsed: 0, creditsPeriodStart: new Date() },
    });
  }

  return { used, allowance, remaining: Math.max(0, allowance - used), plan };
}

/** Vérifie et consomme des crédits. Renvoie null si OK, sinon un message d'erreur. */
export async function consumeCredits(userId: string, cost: number): Promise<string | null> {
  const { remaining, allowance } = await getCredits(userId);
  if (cost > remaining) {
    return `Crédits insuffisants (${remaining}/${allowance} restants, coût : ${cost}). Passez à un plan supérieur.`;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { creditsUsed: { increment: cost } },
  });
  return null;
}

// ---------- Générateur IMAGE (Gemini image / démo SVG procédural) ----------

export async function generateImage(
  prompt: string,
  params: { ratio?: string; negative?: string; quality?: string }
): Promise<{ url: string; demo: boolean }> {
  // 1) Replicate FLUX (prioritaire : meilleur rapport qualité/prix)
  if (replicateConfigured()) {
    try {
      const r = await replicateRun(MODELS.image(), {
        prompt: `${prompt}${params.negative ? ` (avoid: ${params.negative})` : ""}`,
        aspect_ratio: params.ratio === "1:1" ? "1:1" : params.ratio === "9:16" ? "9:16" : "16:9",
        num_outputs: 1,
        output_format: "png",
        go_fast: params.quality !== "ultra",
      });
      if (r.url) {
        const data = await urlToDataUrl(r.url);
        return { url: data || r.url, demo: false };
      }
    } catch {
      /* repli Gemini / démo */
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const vertical = params.ratio === "9:16";
  if (apiKey) {
    try {
      const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a single ${params.ratio === "1:1" ? "square" : vertical ? "vertical 9:16" : "landscape 16:9"} high quality image. ${prompt}${params.negative ? `. Avoid: ${params.negative}` : ""}`,
                  },
                ],
              },
            ],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const img = (json.candidates?.[0]?.content?.parts ?? []).find(
          (p: any) => p.inlineData?.data
        );
        if (img) {
          return {
            url: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`,
            demo: false,
          };
        }
      }
    } catch {
      /* repli démo */
    }
  }
  return { url: proceduralSVG(prompt, params.ratio ?? "16:9"), demo: true };
}

// Art procédural SVG déterministe (mode démo, généré côté serveur)
function proceduralSVG(seedText: string, ratio: string): string {
  const [w, h] = ratio === "9:16" ? [720, 1280] : ratio === "1:1" ? [900, 900] : [1280, 720];
  let seed = 0;
  for (const c of seedText) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const hues = [190, 265, 300, 20, 330, 150];
  let blobs = "";
  for (let i = 0; i < 9; i++) {
    const hue = hues[Math.floor(rand() * hues.length)];
    blobs += `<circle cx="${Math.round(rand() * w)}" cy="${Math.round(rand() * h)}" r="${Math.round(80 + rand() * (w / 3))}" fill="hsla(${hue},90%,60%,${(0.15 + rand() * 0.3).toFixed(2)})" filter="url(#b)"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><filter id="b"><feGaussianBlur stdDeviation="40"/></filter></defs><rect width="${w}" height="${h}" fill="#0a0618"/>${blobs}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// ---------- Générateur RÉDACTEUR (Gemini texte / démo) ----------

export async function generateText(
  prompt: string,
  params: { type?: string; ton?: string; langue?: string; longueur?: string }
): Promise<{ text: string; demo: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const instruction = `Tu es un rédacteur professionnel. Rédige un contenu de type « ${params.type ?? "blog"} » en ${params.langue ?? "français"}, ton ${params.ton ?? "professionnel"}, longueur ${params.longueur ?? "moyenne"}. Sujet : ${prompt}. Réponds uniquement avec le contenu, en markdown léger.`;
  if (apiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: instruction }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, demo: false };
      }
    } catch {
      /* repli démo */
    }
  }
  return {
    text: `## ${prompt}\n\nCeci est un contenu de démonstration (${params.type ?? "blog"}, ton ${params.ton ?? "professionnel"}).\n\nAjoutez GEMINI_API_KEY dans .env pour une rédaction réelle par l'IA : introduction accrocheuse, développement structuré, appels à l'action et optimisation ${params.type === "seo" ? "SEO" : "éditoriale"} — le tout calibré pour votre audience.\n\n- Point clé n°1 sur « ${prompt} »\n- Point clé n°2 avec bénéfice concret\n- Point clé n°3 orienté conversion\n\n**Conclusion :** un contenu prêt à publier, généré en quelques secondes.`,
    demo: true,
  };
}

// ---------- Générateur VOIX (ElevenLabs / démo) ----------

const VOICE_IDS: Record<string, string> = {
  charlotte: "XB0fDUnXU5powFXDhCwa",
  antoni: "ErXwobaYiN019PkySvjV",
  rachel: "21m00Tcm4TlvDq8ikWAM",
};

export async function generateVoice(
  text: string,
  voice: string
): Promise<{ url: string | null; demo: boolean }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return { url: null, demo: true };
  try {
    const voiceId = VOICE_IDS[voice] || process.env.ELEVENLABS_VOICE_ID || VOICE_IDS.charlotte;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: text.slice(0, 600),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });
    if (!res.ok) return { url: null, demo: true };
    const buf = Buffer.from(await res.arrayBuffer());
    return { url: `data:audio/mpeg;base64,${buf.toString("base64")}`, demo: false };
  } catch {
    return { url: null, demo: true };
  }
}

// ---------- Générateur MUSIQUE (synthèse WAV procédurale) ----------
// Pas d'API musicale branchée : on synthétise une vraie mélodie (WAV) côté
// serveur — déterministe selon le prompt, tempo et ambiance ajustables.

export async function generateMusic(
  prompt: string,
  params: { tempo?: number; duree?: number; ambiance?: string; genre?: string; instrument?: string }
): Promise<{ url: string; demo: boolean }> {
  // 1) Replicate MusicGen (vraie musique IA)
  if (replicateConfigured()) {
    try {
      const desc = [params.genre, params.ambiance, params.instrument, prompt]
        .filter(Boolean)
        .join(", ");
      const r = await replicateRun(MODELS.music(), {
        prompt: desc,
        duration: Math.min(20, Math.max(4, params.duree ?? 8)),
        model_version: "stereo-large",
        output_format: "mp3",
      });
      if (r.url) {
        const data = await urlToDataUrl(r.url);
        if (data) return { url: data, demo: false };
      }
    } catch {
      /* repli synthèse WAV locale */
    }
  }

  const sampleRate = 16000;
  const seconds = Math.min(12, Math.max(4, params.duree ?? 8));
  const bpm = Math.min(180, Math.max(60, params.tempo ?? 100));
  const n = sampleRate * seconds;

  let seed = 0;
  for (const c of prompt) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Gamme pentatonique (mineure si ambiance sombre)
  const dark = /sombre|triste|dark|épique|epic/i.test(params.ambiance ?? "");
  const base = dark ? 220 : 262;
  const scale = dark ? [1, 1.189, 1.335, 1.498, 1.782] : [1, 1.125, 1.25, 1.5, 1.667];

  const beat = 60 / bpm / 2; // croches
  const samples = new Int16Array(n);
  let t0 = 0;
  while (t0 < seconds) {
    const freq = base * scale[Math.floor(rand() * scale.length)] * (rand() > 0.8 ? 2 : 1);
    const dur = beat * (rand() > 0.7 ? 2 : 1);
    const start = Math.floor(t0 * sampleRate);
    const len = Math.min(Math.floor(dur * sampleRate), n - start);
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const env = Math.min(1, i / 400) * Math.exp(-t * 3.2);
      const mel = Math.sin(2 * Math.PI * freq * t) * 0.5 + Math.sin(4 * Math.PI * freq * t) * 0.15;
      const bass = Math.sin(2 * Math.PI * (base / 2) * ((start + i) / sampleRate)) * 0.18;
      const v = (mel * env + bass) * 0.55;
      samples[start + i] = Math.max(-32767, Math.min(32767, Math.round(v * 32767 + samples[start + i])));
    }
    t0 += dur;
  }

  // En-tête WAV (PCM 16-bit mono)
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  Buffer.from(samples.buffer).copy(buf, 44);

  return { url: `data:audio/wav;base64,${buf.toString("base64")}`, demo: true };
}
