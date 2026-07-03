// Génération de scripts vidéo viraux via Gemini (Google AI Studio),
// avec streaming mot-à-mot. Sans clé API : mode démo (script simulé).

export type Platform = "tiktok" | "reels" | "shorts" | "youtube";

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  reels: "Instagram Reels",
  shorts: "YouTube Shorts",
  youtube: "YouTube (long format)",
};

type RepoInfo = {
  fullName: string;
  description: string;
  stars: number;
  velocity: number;
  url: string;
  language?: string | null;
};

function buildPrompt(repo: RepoInfo, platform: Platform): string {
  const short = platform !== "youtube";
  return `Tu es un expert en contenu viral tech francophone.
Écris un script vidéo ${short ? "COURT et PUNCHY (30-45 secondes, format vertical)" : "LONG (3-5 minutes, format YouTube)"} pour la plateforme ${PLATFORM_LABELS[platform]}.

Sujet : le dépôt GitHub "${repo.fullName}" qui explose en ce moment.
Description : ${repo.description}
Étoiles : ${repo.stars} (+${repo.velocity} étoiles/jour !)
Langage : ${repo.language ?? "N/A"}
URL : ${repo.url}

Règles :
- Commence par un HOOK choc dans les 2 premières secondes.
- ${short ? "Phrases très courtes, rythme rapide, une idée par phrase." : "Structure : hook, contexte, démo, cas d'usage, avis, call-to-action."}
- Ton énergique, accessible, sans jargon inutile.
- Termine par un call-to-action (abonne-toi / lien en bio).
- Écris UNIQUEMENT le texte à dire à voix haute, une phrase par ligne, sans indications scéniques, sans markdown, sans emojis.`;
}

/** Appelle Gemini en streaming SSE et renvoie un flux de texte brut. */
export async function streamScript(
  repo: RepoInfo,
  platform: Platform
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return demoStream(repo, platform);

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Garde sur la phase de connexion (20 s) : si Gemini ne répond pas, on
  // bascule en démo. Le minuteur est annulé dès réception des en-têtes pour
  // ne pas couper le streaming ensuite.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(repo, platform) }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
      }),
      signal: ctrl.signal,
    });
  } catch {
    clearTimeout(timer);
    return demoStream(repo, platform);
  }
  clearTimeout(timer);

  if (!res.ok || !res.body) {
    // Repli transparent sur le mode démo en cas d'erreur API
    return demoStream(repo, platform);
  }

  // Transforme le SSE Gemini en texte brut
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const reader = res.body.getReader();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const text =
            json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          // ligne partielle — ignorée
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

/** Mode démo : streame mot-à-mot un script viral crédible. */
function demoStream(
  repo: RepoInfo,
  platform: Platform
): ReadableStream<Uint8Array> {
  const name = repo.fullName.split("/")[1] ?? repo.fullName;
  const short = platform !== "youtube";

  const shortScript = [
    `Stop ! Ce repo GitHub gagne ${repo.velocity} étoiles par JOUR.`,
    `Il s'appelle ${name}, et il est en train de tout casser.`,
    `${repo.description || "Un outil IA open-source qui change la donne."}`,
    `Déjà ${repo.stars.toLocaleString("fr-FR")} étoiles en quelques semaines.`,
    `Pourquoi tout le monde en parle ?`,
    `Parce que c'est gratuit, open-source, et redoutablement efficace.`,
    `Tu peux l'installer en une seule commande.`,
    `Les devs qui l'ont testé ne reviennent plus en arrière.`,
    `Si tu bosses dans la tech, tu ne peux pas passer à côté.`,
    `Le lien est en bio. Teste-le avant tout le monde.`,
    `Abonne-toi, le prochain repo explosif arrive demain.`,
  ];

  const longScript = [
    `Imagine un outil open-source qui gagne ${repo.velocity} étoiles GitHub par jour. Ça n'arrive presque jamais. Et pourtant, c'est exactement ce qui se passe avec ${name}.`,
    `Salut à tous et bienvenue ! Aujourd'hui on décortique le dépôt GitHub dont toute la communauté IA parle.`,
    `${repo.description || "C'est un projet IA open-source qui redéfinit les standards."}`,
    `En quelques semaines seulement, le projet a dépassé les ${repo.stars.toLocaleString("fr-FR")} étoiles. Pour vous donner un ordre d'idée, la plupart des projets mettent des années à atteindre ce niveau.`,
    `Alors concrètement, qu'est-ce que ça fait ? Le projet est écrit en ${repo.language ?? "Python"}, et son installation tient en une seule ligne de commande.`,
    `Premier point fort : la simplicité. La documentation est claire, les exemples fonctionnent du premier coup, et la communauté répond en quelques heures.`,
    `Deuxième point fort : les performances. Les premiers benchmarks montrent des résultats impressionnants face aux alternatives propriétaires.`,
    `Troisième point : c'est totalement gratuit et open-source. Vous pouvez auditer le code, le modifier, et l'intégrer dans vos propres projets.`,
    `Mon avis honnête ? Ce genre de croissance n'est jamais un hasard. Quand des milliers de développeurs adoptent un outil aussi vite, c'est qu'il répond à un vrai besoin.`,
    `Si vous voulez le tester, le lien est en description. Et si cette vidéo vous a aidé, un like et un abonnement, ça m'aide énormément à continuer.`,
    `On se retrouve très vite pour analyser le prochain projet qui explose. Ciao !`,
  ];

  const lines = short ? shortScript : longScript;
  const words = lines.join("\n").split(/(?<= )/); // conserve les espaces
  const encoder = new TextEncoder();
  let i = 0;

  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) {
        controller.close();
        return;
      }
      await new Promise((r) => setTimeout(r, 28)); // effet mot-à-mot
      controller.enqueue(encoder.encode(words[i]));
      i++;
    },
  });
}
