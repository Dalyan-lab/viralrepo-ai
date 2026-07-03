// Détection des dépôts IA en pleine explosion via l'API GitHub officielle.
// Classement par "vélocité" = étoiles gagnées par jour depuis la création.

export type TrendingRepo = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  ownerAvatar: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
  createdAt: string;
  velocity: number; // étoiles / jour
  badge: "EXPLOSIF" | "EN FUSION" | "MONTÉE RAPIDE" | "TENDANCE";
  topics: string[];
};

function badgeFor(velocity: number): TrendingRepo["badge"] {
  if (velocity >= 300) return "EXPLOSIF";
  if (velocity >= 120) return "EN FUSION";
  if (velocity >= 40) return "MONTÉE RAPIDE";
  return "TENDANCE";
}

// L'API de recherche GitHub ne supporte pas les OR/parenthèses :
// on cible un mot-clé par catégorie dans le nom/description/topics.
export type Category = "all" | "llm" | "agents" | "rag" | "vision" | "voice";
export type Period = "hot" | "month" | "year";

const CATEGORY_KEYWORDS: Record<Category, string> = {
  all: "ai",
  llm: "llm",
  agents: "agent",
  rag: "rag",
  vision: "vision",
  voice: "tts",
};

// Fenêtre temporelle + seuil d'étoiles adapté
const PERIODS: Record<Period, { days: number; minStars: number }> = {
  hot: { days: 14, minStars: 50 },
  month: { days: 30, minStars: 100 },
  year: { days: 365, minStars: 500 },
};

const cache = new Map<string, { at: number; data: TrendingRepo[] }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min — "temps réel" raisonnable sans épuiser l'API

export async function fetchTrendingAIRepos(
  category: Category = "all",
  period: Period = "hot"
): Promise<{ repos: TrendingRepo[]; source: "github" | "demo" }> {
  const key = `${category}:${period}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return { repos: hit.data, source: "github" };
  }

  const { days, minStars } = PERIODS[period] ?? PERIODS.hot;
  const keyword = CATEGORY_KEYWORDS[category] ?? "ai";
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const params = new URLSearchParams({
    q: `${keyword} in:name,description,topics created:>${sinceStr} stars:>${minStars}`,
    sort: "stars",
    order: "desc",
    per_page: "24",
  });

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ViralRepo.AI",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // Abandon au bout de 8 s : si GitHub traîne, on bascule en démo au lieu
    // de bloquer la page indéfiniment.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8_000);
    const res = await fetch(
      `https://api.github.com/search/repositories?${params}`,
      { headers, next: { revalidate: 0 }, signal: ctrl.signal }
    ).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const json = await res.json();
    if (!json.items?.length) throw new Error("GitHub API: aucun résultat");

    const repos: TrendingRepo[] = (json.items || []).map((r: any) => {
      const ageDays = Math.max(
        1,
        (Date.now() - new Date(r.created_at).getTime()) / 86_400_000
      );
      const velocity = Math.round((r.stargazers_count / ageDays) * 10) / 10;
      return {
        id: r.id,
        fullName: r.full_name,
        name: r.name,
        owner: r.owner?.login ?? "",
        ownerAvatar: r.owner?.avatar_url ?? "",
        url: r.html_url,
        description: r.description ?? "",
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        createdAt: r.created_at,
        velocity,
        badge: badgeFor(velocity),
        topics: (r.topics ?? []).slice(0, 4),
      };
    });

    repos.sort((a, b) => b.velocity - a.velocity);
    cache.set(key, { at: Date.now(), data: repos });
    return { repos, source: "github" };
  } catch {
    return { repos: DEMO_REPOS, source: "demo" };
  }
}

// Données de secours si l'API GitHub est indisponible (limite de débit, hors-ligne…)
export const DEMO_REPOS: TrendingRepo[] = [
  {
    id: 1,
    fullName: "deepmind-labs/agentforge",
    name: "agentforge",
    owner: "deepmind-labs",
    ownerAvatar: "",
    url: "https://github.com",
    description:
      "Framework open-source pour orchestrer des essaims d'agents IA autonomes.",
    stars: 18400,
    forks: 1200,
    language: "Python",
    createdAt: new Date(Date.now() - 12 * 86_400_000).toISOString(),
    velocity: 1533,
    badge: "EXPLOSIF",
    topics: ["ai", "agents", "llm"],
    },
  {
    id: 2,
    fullName: "nova-ai/promptcache",
    name: "promptcache",
    owner: "nova-ai",
    ownerAvatar: "",
    url: "https://github.com",
    description: "Cache sémantique ultra-rapide pour réduire de 90% vos coûts LLM.",
    stars: 9100,
    forks: 540,
    language: "Rust",
    createdAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    velocity: 455,
    badge: "EXPLOSIF",
    topics: ["llm", "cache", "rust"],
  },
  {
    id: 3,
    fullName: "openvision/pixelmind",
    name: "pixelmind",
    owner: "openvision",
    ownerAvatar: "",
    url: "https://github.com",
    description: "Génération vidéo IA en temps réel dans le navigateur (WebGPU).",
    stars: 6300,
    forks: 410,
    language: "TypeScript",
    createdAt: new Date(Date.now() - 25 * 86_400_000).toISOString(),
    velocity: 252,
    badge: "EN FUSION",
    topics: ["ai", "video", "webgpu"],
  },
  {
    id: 4,
    fullName: "ml-tools/tinytrainer",
    name: "tinytrainer",
    owner: "ml-tools",
    ownerAvatar: "",
    url: "https://github.com",
    description: "Fine-tunez des LLM sur un simple laptop, sans GPU.",
    stars: 3900,
    forks: 260,
    language: "Python",
    createdAt: new Date(Date.now() - 28 * 86_400_000).toISOString(),
    velocity: 139,
    badge: "EN FUSION",
    topics: ["llm", "finetuning"],
  },
  {
    id: 5,
    fullName: "quantumdev/voicecraft",
    name: "voicecraft",
    owner: "quantumdev",
    ownerAvatar: "",
    url: "https://github.com",
    description: "Clonage vocal open-source multilingue de qualité studio.",
    stars: 2100,
    forks: 180,
    language: "Python",
    createdAt: new Date(Date.now() - 26 * 86_400_000).toISOString(),
    velocity: 81,
    badge: "MONTÉE RAPIDE",
    topics: ["tts", "voice", "ai"],
  },
  {
    id: 6,
    fullName: "webml/browserbrain",
    name: "browserbrain",
    owner: "webml",
    ownerAvatar: "",
    url: "https://github.com",
    description: "Exécutez des modèles IA 100% en local dans votre navigateur.",
    stars: 1500,
    forks: 90,
    language: "JavaScript",
    createdAt: new Date(Date.now() - 29 * 86_400_000).toISOString(),
    velocity: 52,
    badge: "MONTÉE RAPIDE",
    topics: ["ai", "wasm", "browser"],
  },
];
