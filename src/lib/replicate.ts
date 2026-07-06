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
};
