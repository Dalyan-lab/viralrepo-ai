// Agrégateur Replicate : une seule clé (REPLICATE_API_TOKEN) → accès aux
// meilleurs modèles image (FLUX), vidéo (Minimax/Kling/Wan) et musique
// (MusicGen). Paiement à l'usage. Sans clé, Montageiv reste en mode démo.

const API = "https://api.replicate.com/v1";

export function replicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

function headers(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Extrait une URL exploitable de la sortie Replicate (string | string[] | objet). */
export function firstOutputUrl(output: any): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return typeof output[0] === "string" ? output[0] : null;
  if (typeof output === "object" && typeof output.url === "string") return output.url;
  return null;
}

/** Télécharge une sortie et l'inline en data URL (permanence — les URLs
 *  Replicate expirent). Réservé aux médias légers (image, audio court). */
export async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8_000_000) return null; // trop lourd pour l'inline
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Lance un modèle et attend le résultat (jusqu'à waitSec s). Idéal image/musique. */
export async function replicateRun(
  model: string,
  input: any,
  waitSec = 55
): Promise<{ url: string | null; id: string; status: string }> {
  const res = await fetch(`${API}/models/${model}/predictions`, {
    method: "POST",
    headers: headers({ Prefer: `wait=${waitSec}` }),
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Replicate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const p = await res.json();
  return { url: firstOutputUrl(p.output), id: p.id, status: p.status };
}

/** Crée une prédiction sans attendre (jobs longs : vidéo). Le client sonde ensuite. */
export async function replicateCreate(
  model: string,
  input: any
): Promise<{ id: string; status: string; url: string | null }> {
  const res = await fetch(`${API}/models/${model}/predictions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`Replicate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const p = await res.json();
  return { id: p.id, status: p.status, url: firstOutputUrl(p.output) };
}

/** État d'une prédiction (polling). */
export async function replicateStatus(
  id: string
): Promise<{ status: string; url: string | null }> {
  const res = await fetch(`${API}/predictions/${id}`, { headers: headers() });
  if (!res.ok) return { status: "error", url: null };
  const p = await res.json();
  return {
    status: p.status, // starting | processing | succeeded | failed | canceled
    url: p.status === "succeeded" ? firstOutputUrl(p.output) : null,
  };
}

// Modèles par défaut (configurables via .env)
export const MODELS = {
  image: () => process.env.REPLICATE_IMAGE_MODEL || "black-forest-labs/flux-schnell",
  music: () => process.env.REPLICATE_MUSIC_MODEL || "meta/musicgen",
  video: () => process.env.REPLICATE_VIDEO_MODEL || "minimax/video-01",
  tts: () => process.env.REPLICATE_TTS_MODEL || "minimax/speech-02-hd",
  lipsync: () => process.env.REPLICATE_LIPSYNC_MODEL || "cjwbw/sadtalker",
};

// ---------- Voix off (TTS) via Replicate — remplace ElevenLabs ----------
// Une seule clé (REPLICATE_API_TOKEN) suffit. Voix préréglées minimax.
export const TTS_VOICES: Record<string, string> = {
  charlotte: "Calm_Woman",
  antoni: "Deep_Voice_Man",
  rachel: "Friendly_Person",
};

/** Génère une voix off (minimax speech). Retourne l'URL de l'audio. */
export async function replicateTTS(
  text: string,
  voice?: string
): Promise<{ url: string | null }> {
  const voice_id = TTS_VOICES[voice ?? ""] || "Calm_Woman";
  const r = await replicateRun(
    MODELS.tts(),
    {
      text: text.replace(/\s+/g, " ").trim().slice(0, 2500),
      voice_id,
      language_boost: "French",
      emotion: "neutral",
      speed: 1,
    },
    60
  );
  // Si pas encore prêt après l'attente, on sonde encore quelques fois.
  if (!r.url && r.id) {
    for (let i = 0; i < 8; i++) {
      await new Promise((res) => setTimeout(res, 2500));
      const st = await replicateStatus(r.id);
      if (st.status === "succeeded" && st.url) return { url: st.url };
      if (st.status === "failed" || st.status === "canceled") return { url: null };
    }
  }
  return { url: r.url };
}

// ---------- Lip-sync / avatar parlant via Replicate — remplace D-ID ----------
// SadTalker (image + audio → tête parlante). Modèle communautaire : il faut
// résoudre la version puis créer la prédiction sur /predictions.

/** Résout la dernière version d'un modèle (nécessaire pour les modèles communautaires). */
export async function replicateLatestVersion(model: string): Promise<string | null> {
  const res = await fetch(`${API}/models/${model}`, { headers: headers() });
  if (!res.ok) return null;
  const j = await res.json();
  return j.latest_version?.id ?? null;
}

/** Crée une prédiction par version (POST /predictions) pour les modèles communautaires. */
export async function replicateCreateVersion(
  version: string,
  input: any
): Promise<{ id: string; status: string; url: string | null }> {
  const res = await fetch(`${API}/predictions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ version, input }),
  });
  if (!res.ok) throw new Error(`Replicate ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const p = await res.json();
  return { id: p.id, status: p.status, url: firstOutputUrl(p.output) };
}

// ---------- Catalogue de générateurs d'images (agrégés via Replicate) ----------
// Modèles réellement hébergés par Replicate (vérifiés). Chaque « family »
// détermine le schéma d'entrée exact (les modèles n'ont pas les mêmes champs).

export type ImageFamily =
  | "nano-pro" | "nano" | "seedream" | "imagen" | "ideogram"
  | "recraft" | "flux-pro" | "flux" | "sd" | "qwen";

export type ImageModelDef = {
  id: string;      // clé stockée dans params.model
  slug: string;    // owner/name sur Replicate
  label: string;
  desc: string;
  family: ImageFamily;
  ref?: boolean;   // accepte une image de référence
};

export const IMAGE_MODELS: ImageModelDef[] = [
  { id: "nano-banana-pro", slug: "google/nano-banana-pro", label: "Nano Banana Pro", desc: "Visuels photoréalistes, parfaits pour pubs et textes.", family: "nano-pro", ref: true },
  { id: "nano-banana", slug: "google/nano-banana", label: "Nano Banana", desc: "Édition et composition d'images avancées.", family: "nano", ref: true },
  { id: "seedream-4", slug: "bytedance/seedream-4", label: "Seedream 4", desc: "Génération rapide et haute fidélité visuelle.", family: "seedream", ref: true },
  { id: "imagen-4", slug: "google/imagen-4", label: "Imagen 4", desc: "Le modèle image haut de gamme de Google.", family: "imagen" },
  { id: "flux-1.1-pro", slug: "black-forest-labs/flux-1.1-pro", label: "FLUX 1.1 Pro", desc: "Qualité pro, rendu très détaillé.", family: "flux-pro", ref: true },
  { id: "flux-dev", slug: "black-forest-labs/flux-dev", label: "FLUX Dev", desc: "Excellent équilibre qualité / coût.", family: "flux", ref: true },
  { id: "flux-schnell", slug: "black-forest-labs/flux-schnell", label: "FLUX Schnell (rapide)", desc: "Le plus rapide et le plus économique.", family: "flux" },
  { id: "ideogram-v3-turbo", slug: "ideogram-ai/ideogram-v3-turbo", label: "Ideogram v3 Turbo", desc: "Texte net et lisible dans l'image.", family: "ideogram" },
  { id: "recraft-v3", slug: "recraft-ai/recraft-v3", label: "Recraft v3", desc: "Design, logos et rendus vectoriels.", family: "recraft" },
  { id: "sd-3.5", slug: "stability-ai/stable-diffusion-3.5-large", label: "Stable Diffusion 3.5", desc: "Open source, très polyvalent.", family: "sd" },
  { id: "qwen-image", slug: "qwen/qwen-image", label: "Qwen Image", desc: "Fort en typographie et scènes complexes.", family: "qwen" },
];

export function imageModelById(id?: string): ImageModelDef {
  return IMAGE_MODELS.find((m) => m.id === id) || IMAGE_MODELS[0];
}

/** Construit l'entrée Replicate adaptée au schéma réel de chaque modèle. */
export function buildImageInput(
  m: ImageModelDef,
  o: { prompt: string; ratio?: string; negative?: string; reference?: string }
): any {
  const ar = o.ratio === "1:1" ? "1:1" : o.ratio === "9:16" ? "9:16" : "16:9";
  const prompt = o.negative ? `${o.prompt} (avoid: ${o.negative})` : o.prompt;
  const ref = o.reference && m.ref ? o.reference : undefined;

  switch (m.family) {
    case "nano-pro": {
      const i: any = { prompt, aspect_ratio: ar, resolution: "2K", output_format: "png" };
      if (ref) i.image_input = [ref];
      return i;
    }
    case "nano": {
      const i: any = { prompt, output_format: "png" };
      if (ref) i.image_input = [ref];
      return i;
    }
    case "seedream": {
      const i: any = { prompt, aspect_ratio: ar, size: "2K", max_images: 1 };
      if (ref) i.image_input = [ref];
      return i;
    }
    case "imagen":
      return { prompt, aspect_ratio: ar, output_format: "png", safety_filter_level: "block_only_high" };
    case "ideogram":
      return { prompt, aspect_ratio: ar };
    case "recraft":
      return {
        prompt,
        size: ar === "9:16" ? "1024x1365" : ar === "1:1" ? "1024x1024" : "1365x1024",
        style: "any",
      };
    case "flux-pro": {
      const i: any = { prompt, aspect_ratio: ar, output_format: "png", prompt_upsampling: true };
      if (ref) i.image_prompt = ref;
      return i;
    }
    case "flux": {
      const i: any = { prompt, aspect_ratio: ar, num_outputs: 1, output_format: "png" };
      if (m.id === "flux-schnell") i.go_fast = true;
      if (ref) i.image = ref;
      return i;
    }
    case "sd":
    case "qwen":
    default:
      return { prompt, aspect_ratio: ar, output_format: "png" };
  }
}
