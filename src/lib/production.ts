// Studio de Production "Pipeline Unifié" — moteur serveur.
// Étape 1 : script deux colonnes (AUDIO / VISUEL) en streaming.
// Étape 4 : détection des 3 hooks viraux (JSON).
// Sans GEMINI_API_KEY : modes démo complets.

export type VideoFormat = "youtube" | "short";

function scriptPrompt(idea: string, format: VideoFormat, tone: string): string {
  const isShort = format === "short";
  return `Tu es scénariste senior de vidéos à forte rétention et directeur artistique IA.

Sujet / idée brute : ${idea}
Format : ${isShort ? "vidéo verticale courte (45-60 s, 6 à 8 scènes)" : "vidéo YouTube (6-8 min, 10 à 12 scènes)"}
Ton : ${tone || "énergique et accessible"}

Écris le script de production complet, scène par scène, STRICTEMENT dans ce format (rien d'autre) :

SCÈNE 1
AUDIO: [texte exact à dire à voix haute, phrases courtes ≤ 15 mots, une idée par phrase]
VISUEL: [prompt de génération d'image en anglais, détaillé : sujet, cadrage, lumière, style cinématique cohérent]

SCÈNE 2
AUDIO: ...
VISUEL: ...

Règles :
- La scène 1 est un HOOK choc (2 premières secondes décisives).
- Garde un style visuel constant d'une scène à l'autre (même palette, même grain).
- La dernière scène contient le call-to-action.
- Pas de markdown, pas de commentaires, uniquement les blocs SCÈNE.`;
}

async function geminiStream(prompt: string): Promise<ReadableStream<Uint8Array> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok || !res.body) return null;

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
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          /* ligne partielle */
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

function wordStream(text: string, delayMs = 10): ReadableStream<Uint8Array> {
  const words = text.split(/(?<= )/);
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) {
        controller.close();
        return;
      }
      await new Promise((r) => setTimeout(r, delayMs));
      controller.enqueue(encoder.encode(words[i]));
      i++;
    },
  });
}

export async function streamProductionScript(
  idea: string,
  format: VideoFormat,
  tone: string
): Promise<ReadableStream<Uint8Array>> {
  const stream = await geminiStream(scriptPrompt(idea, format, tone));
  if (stream) return stream;
  return wordStream(demoScript(idea, format));
}

// ---- Démo : script 2 colonnes crédible ----
function demoScript(idea: string, format: VideoFormat): string {
  const short = format === "short";
  const scenes: [string, string][] = short
    ? [
        [
          `Stop ! ${idea} — et personne n'en parle encore.`,
          "extreme close-up of a glowing computer screen reflecting in human eyes, dark room, neon cyan and magenta light, cinematic, shallow depth of field, 35mm",
        ],
        [
          `Voilà pourquoi ça change tout, en 45 secondes.`,
          "dynamic wide shot of a futuristic control room with holographic dashboards, purple and cyan neon, volumetric fog, cinematic lighting",
        ],
        [
          `Premier point : c'est plus simple que tout ce qui existe.`,
          "clean minimalist desk with a single laptop showing colorful code, soft neon rim light, ultra realistic, product photography style",
        ],
        [
          `Deuxième point : les résultats arrivent en quelques minutes.`,
          "time-lapse style shot of a progress bar filling on a giant holographic display, sparks of light, dark tech environment",
        ],
        [
          `Troisième point : c'est accessible dès aujourd'hui, gratuitement.`,
          "hands opening a glowing gift box emitting cyan light particles, dark background, macro photography, cinematic",
        ],
        [
          `Ceux qui s'y mettent maintenant auront six mois d'avance.`,
          "silhouette of a person standing before a giant rising sun made of digital particles, epic scale, purple sky, cinematic wide angle",
        ],
        [
          `Abonne-toi : le prochain sujet chaud tombe demain.`,
          "bold neon subscribe button floating in 3D space surrounded by energy rings, cyan magenta gradient, motion blur, cinematic",
        ],
      ]
    : [
        [
          `Imaginez : ${idea}. Ça paraît de la science-fiction, et pourtant c'est déjà là.`,
          "cinematic establishing shot of a futuristic city skyline at dusk, neon cyan and magenta accents, volumetric light, anamorphic lens flare, 35mm film grain",
        ],
        [
          `Bienvenue ! Aujourd'hui on décortique le sujet en profondeur, preuves à l'appui.`,
          "confident presenter silhouette in a dark studio with glowing purple LED panels, medium shot, shallow depth of field, cinematic",
        ],
        [
          `D'abord, le contexte : d'où ça vient, et pourquoi ça explose maintenant.`,
          "animated style world map with glowing connection lines spreading rapidly, dark blue background, data visualization aesthetic",
        ],
        [
          `Le premier pilier, c'est la technologie elle-même. Voici comment elle fonctionne.`,
          "exploded view of a glowing AI chip with circuits extending like a neural network, macro shot, cyan light, ultra detailed",
        ],
        [
          `Regardez ces chiffres : la croissance est tout simplement verticale.`,
          "3D bar chart rising dramatically out of a dark floor, bars made of glowing light, camera low angle, cinematic depth",
        ],
        [
          `Deuxième pilier : les cas d'usage concrets, dès aujourd'hui.`,
          "split screen montage of people using futuristic tools in office, studio and home settings, warm and cyan mixed lighting, realistic",
        ],
        [
          `Voici la démonstration en conditions réelles. Observez bien cette étape.`,
          "over-the-shoulder shot of hands typing on a keyboard with a vibrant interface on screen, bokeh background, cinematic macro",
        ],
        [
          `Troisième pilier : ce que ça signifie pour vous, concrètement.`,
          "person standing at a crossroads made of light paths in a dark landscape, each path glowing a different color, epic wide shot",
        ],
        [
          `Bien sûr, il y a des limites. Parlons-en honnêtement.`,
          "balanced scale hologram floating between two hands, one side glowing green one side red, dark studio, cinematic contrast",
        ],
        [
          `Mon verdict après plusieurs semaines de test : voici ce que je retiens.`,
          "close-up of a notebook with handwritten notes next to a glowing tablet, warm desk lamp mixed with cyan screen light, realistic",
        ],
        [
          `Si cette analyse vous a aidé, abonnez-vous : on se retrouve chaque semaine.`,
          "elegant end screen composition with floating video thumbnails and a pulsing subscribe icon, dark gradient background, neon accents",
        ],
      ];

  return scenes
    .map(([audio, visuel], i) => `SCÈNE ${i + 1}\nAUDIO: ${audio}\nVISUEL: ${visuel}`)
    .join("\n\n");
}

// ---- Étape 4 : détection des hooks viraux ----
export type ViralHook = {
  titre: string;
  hook: string;
  ecran: string;
  scenes: number[];
  score: number;
};

export async function generateHooks(
  script: string,
  sceneCount: number
): Promise<{ hooks: ViralHook[]; demo: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyse ce script vidéo découpé en scènes numérotées. Identifie les 3 segments au plus fort potentiel viral pour des formats courts (Shorts/Reels), notés sur 10 selon : émotion (surprise/controverse), boucle ouverte, valeur autonome.

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown :
[{"titre":"...","hook":"hook réécrit ≤ 8 mots","ecran":"texte à l'écran ≤ 5 mots","scenes":[numéros des scènes à inclure, 2 à 4 scènes],"score":8.5}]

Script :
${script.slice(0, 12000)}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text: string =
          json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const hooks = JSON.parse(match[0]) as ViralHook[];
          if (Array.isArray(hooks) && hooks.length > 0) {
            return {
              hooks: hooks.slice(0, 3).map((h) => ({
                ...h,
                scenes: (h.scenes ?? [1]).filter(
                  (n) => n >= 1 && n <= sceneCount
                ),
              })),
              demo: false,
            };
          }
        }
      }
    } catch {
      /* repli démo */
    }
  }

  // Démo : début, cœur, conclusion
  const mid = Math.max(2, Math.ceil(sceneCount / 2));
  return {
    demo: !apiKey,
    hooks: [
      {
        titre: "Le hook d'ouverture",
        hook: "Personne n'en parle encore.",
        ecran: "TU DOIS VOIR ÇA",
        scenes: [1, 2].filter((n) => n <= sceneCount),
        score: 9.2,
      },
      {
        titre: "La preuve choc",
        hook: "Ces chiffres sont fous.",
        ecran: "CROISSANCE VERTICALE 📈",
        scenes: [mid, Math.min(mid + 1, sceneCount)],
        score: 8.7,
      },
      {
        titre: "Le verdict final",
        hook: "Mon avis va vous surprendre.",
        ecran: "VERDICT HONNÊTE",
        scenes: [Math.max(1, sceneCount - 1), sceneCount],
        score: 8.1,
      },
    ],
  };
}
