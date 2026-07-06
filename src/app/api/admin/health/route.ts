import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Diagnostic des connexions (admin only) : pour chaque intégration, indique si
// la clé est configurée et effectue un test réel côté serveur quand c'est possible.
// Tous les tests tournent EN PARALLÈLE avec abandon réel (AbortController) —
// le panneau répond en quelques secondes maximum, jamais de blocage.

export const dynamic = "force-dynamic";

type Check = {
  id: string;
  label: string;
  role: string;
  configured: boolean;
  status: "live" | "demo" | "error" | "warn";
  detail: string;
  models?: string[];
};

async function timedFetch(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function geminiCheck(): Promise<Check> {
  const key = process.env.GEMINI_API_KEY;
  const check: Check = {
    id: "gemini",
    label: "Google Gemini",
    role: "Scripts, blueprints, images IA",
    configured: !!key,
    status: key ? "warn" : "demo",
    detail: key ? "Clé présente, test en cours…" : "Aucune clé — mode démo.",
  };
  if (!key) return check;
  try {
    const res = await timedFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`,
      {},
      9_000
    );
    if (res.ok) {
      const json = await res.json();
      const all: string[] = (json.models ?? [])
        .filter((m: any) =>
          (m.supportedGenerationMethods ?? []).includes("generateContent")
        )
        .map((m: any) => (m.name ?? "").replace("models/", ""))
        .filter(Boolean);
      check.models = all;
      const wanted = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const imgWanted = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
      const hasText = all.includes(wanted);
      const hasImg = all.some((m) => m === imgWanted || m.includes("image"));
      if (hasText) {
        check.status = "live";
        check.detail = `Connecté. Modèle « ${wanted} » disponible.${hasImg ? " Génération d'images OK." : " ⚠️ Modèle image à vérifier."}`;
      } else {
        check.status = "warn";
        const suggest =
          all.find((m) => m.includes("flash") && !m.includes("image")) ||
          all.find((m) => m.includes("pro")) ||
          all[0];
        check.detail = `Clé valide, mais « ${wanted} » introuvable. Utilisez plutôt : ${suggest ?? "voir liste"}.`;
      }
    } else {
      check.status = "error";
      check.detail = `Clé refusée (HTTP ${res.status}). Vérifiez la clé.`;
    }
  } catch {
    check.status = "error";
    check.detail = "Impossible de joindre l'API Gemini (réseau/timeout).";
  }
  return check;
}

async function githubCheck(): Promise<Check> {
  const token = process.env.GITHUB_TOKEN;
  const check: Check = {
    id: "github_token",
    label: "GitHub API",
    role: "Radar des repos en tendance",
    configured: !!token,
    status: "live",
    detail: token ? "Test en cours…" : "Sans token : 10 req/min (mode limité).",
  };
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ViralRepo.AI",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await timedFetch("https://api.github.com/rate_limit", { headers }, 8_000);
    if (res.ok) {
      const json = await res.json();
      const limit = json.resources?.search?.limit ?? json.rate?.limit ?? 0;
      const remaining =
        json.resources?.search?.remaining ?? json.rate?.remaining ?? 0;
      check.status = token ? "live" : "warn";
      check.detail = token
        ? `Token valide. Recherche : ${remaining}/${limit} req restantes.`
        : `Fonctionne sans token (${remaining}/${limit}). Ajoutez un token pour 30/min.`;
    } else if (token) {
      check.status = "error";
      check.detail = `Token refusé (HTTP ${res.status}).`;
    }
  } catch {
    check.status = token ? "error" : "warn";
    check.detail = "API GitHub injoignable.";
  }
  return check;
}

async function resendCheck(): Promise<Check> {
  const key = process.env.RESEND_API_KEY;
  const check: Check = {
    id: "resend",
    label: "Emails (Resend)",
    role: "Récupération de mot de passe par email",
    configured: !!key,
    status: key ? "warn" : "demo",
    detail: key ? "Test en cours…" : "Sans clé : le lien s'affiche à l'écran.",
  };
  if (!key) return check;
  try {
    const res = await timedFetch(
      "https://api.resend.com/domains",
      { headers: { Authorization: `Bearer ${key}` } },
      8_000
    );
    check.status = res.ok ? "live" : "error";
    check.detail = res.ok
      ? "Clé valide. Les emails partent réellement."
      : `Clé refusée (HTTP ${res.status}).`;
  } catch {
    check.status = "error";
    check.detail = "API Resend injoignable.";
  }
  return check;
}

function paystackCheck(): Check {
  const key = process.env.PAYSTACK_SECRET_KEY;
  const live = key?.startsWith("sk_live");
  return {
    id: "paystack",
    label: "Paiements (Paystack)",
    role: "Abonnements — cartes + Mobile Money (CI)",
    configured: !!key,
    status: key ? "live" : "demo",
    detail: key
      ? `Clé ${live ? "LIVE (réelle)" : "TEST"} présente. Paiements actifs (carte + mobile money).`
      : "Sans clé : plans affichés en mode démo.",
  };
}

function runwayCheck(): Check {
  const key = process.env.RUNWAY_API_KEY;
  return {
    id: "runway",
    label: "Vidéo IA (Runway)",
    role: "Anime les images des scènes en plans vidéo",
    configured: !!key,
    status: key ? "live" : "demo",
    detail: key
      ? "Clé présente. Animation vidéo IA activée (facturée à l'usage)."
      : "Sans clé : effet Ken Burns (démo).",
  };
}

function replicateCheck(): Check {
  const key = process.env.REPLICATE_API_TOKEN;
  return {
    id: "replicate",
    label: "Montageiv — Replicate",
    role: "Image (FLUX), vidéo & musique de Montageiv IA",
    configured: !!key,
    status: key ? "live" : "demo",
    detail: key
      ? "Clé présente. Générateurs image/vidéo/musique actifs (paiement à l'usage)."
      : "Sans clé : modules Montageiv en mode démo.",
  };
}

async function elevenCheck(): Promise<Check> {
  const key = process.env.ELEVENLABS_API_KEY;
  const check: Check = {
    id: "elevenlabs",
    label: "Voix off IA (ElevenLabs)",
    role: "Voix off ultra-réaliste dans les vidéos",
    configured: !!key,
    status: key ? "warn" : "demo",
    detail: key ? "Test en cours…" : "Sans clé : voix du navigateur (démo).",
  };
  if (!key) return check;
  try {
    const res = await timedFetch(
      "https://api.elevenlabs.io/v1/user/subscription",
      { headers: { "xi-api-key": key } },
      8_000
    );
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      check.status = "live";
      const used = j.character_count;
      const lim = j.character_limit;
      check.detail =
        used != null && lim != null
          ? `Connecté. Crédits : ${lim - used}/${lim} caractères restants.`
          : "Connecté. Voix IA active.";
    } else {
      check.status = "error";
      check.detail = `Clé refusée (HTTP ${res.status}).`;
    }
  } catch {
    check.status = "error";
    check.detail = "API ElevenLabs injoignable.";
  }
  return check;
}

async function didCheck(): Promise<Check> {
  const key = process.env.DID_API_KEY;
  const check: Check = {
    id: "did",
    label: "Avatar D-ID",
    role: "Avatar parlant lip-sync",
    configured: !!key,
    status: key ? "warn" : "demo",
    detail: key ? "Test en cours…" : "Sans clé : vidéo d'exemple (démo).",
  };
  if (!key) return check;
  try {
    const res = await timedFetch(
      "https://api.d-id.com/credits",
      { headers: { Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}` } },
      8_000
    );
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      check.status = "live";
      check.detail = `Connecté.${json.remaining != null ? ` Crédits restants : ${json.remaining}.` : ""}`;
    } else {
      check.status = "error";
      check.detail = `Clé refusée (HTTP ${res.status}).`;
    }
  } catch {
    check.status = "error";
    check.detail = "API D-ID injoignable.";
  }
  return check;
}

function oauthCheck(
  id: string,
  label: string,
  clientId?: string,
  secret?: string
): Check {
  const ok = !!clientId && !!secret;
  return {
    id,
    label,
    role: `Bouton « Se connecter avec ${label.replace("Connexion ", "")} »`,
    configured: ok,
    status: ok ? "live" : "demo",
    detail: ok
      ? "Identifiants présents. Testez le bouton sur /login."
      : "Non configuré — le bouton affiche un message d'aide.",
  };
}

function secretCheck(): Check {
  const secret = process.env.AUTH_SECRET || "";
  const weak =
    !secret ||
    secret.includes("change") ||
    secret.includes("dev") ||
    secret.length < 32;
  return {
    id: "auth_secret",
    label: "Secret de session (JWT)",
    role: "Sécurité des connexions",
    configured: !weak,
    status: weak ? "warn" : "live",
    detail: weak
      ? "⚠️ Secret faible/par défaut. À remplacer avant la mise en ligne."
      : "Secret robuste configuré.",
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Tous les tests réseau en parallèle → temps total = le plus lent, pas la somme.
  const [gemini, github, resend, eleven, did] = await Promise.all([
    geminiCheck(),
    githubCheck(),
    resendCheck(),
    elevenCheck(),
    didCheck(),
  ]);

  const checks: Check[] = [
    gemini,
    github,
    oauthCheck(
      "google_oauth",
      "Connexion Google",
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    ),
    oauthCheck(
      "github_oauth",
      "Connexion GitHub",
      process.env.GITHUB_CLIENT_ID,
      process.env.GITHUB_CLIENT_SECRET
    ),
    resend,
    eleven,
    runwayCheck(),
    replicateCheck(),
    paystackCheck(),
    did,
    secretCheck(),
  ];

  const liveCount = checks.filter((c) => c.status === "live").length;
  return NextResponse.json({ checks, liveCount, total: checks.length });
}
