// Architecte de Studio IA : génère un blueprint complet de studio de
// production de contenu automatisé (4 piliers), via Gemini en streaming.
// Sans clé API : blueprint démo de haute qualité streamé mot-à-mot.

export type BudgetLevel = "eco" | "balanced" | "premium";

export const BUDGET_LABELS: Record<BudgetLevel, string> = {
  eco: "Éco (bootstrapping, ~50€/mois)",
  balanced: "Équilibré (~200€/mois)",
  premium: "Premium (performance maximale)",
};

function buildArchitectPrompt(
  idea: string,
  niche: string,
  budget: BudgetLevel
): string {
  return `Rôle : Tu es un Architecte de Systèmes IA et un Directeur de Post-Production senior. Ton objectif est de concevoir l'infrastructure logique, le choix des outils et les workflows automatisés pour créer un studio complet et ultra-performant de génération de contenu (Image, Vidéo, Recoupage/Scripting, Montage).

Le studio doit fonctionner selon un principe de "Pipeline Unifié" : une idée brute entre d'un côté, et des contenus finalisés (longs et courts formats) sortent de l'autre, avec un minimum de frictions.

Contexte du client :
- Idée brute / projet : ${idea}
- Niche : ${niche || "généraliste tech"}
- Niveau de budget : ${BUDGET_LABELS[budget]}

Structure ta réponse en 4 piliers professionnels :

## 1. ARCHITECTURE DES OUTILS (La "Tech Stack")
Sélectionne et associe les meilleurs outils actuels du marché (API, logiciels, IA) en précisant leur rôle exact pour :
- Génération & Édition d'Images (ex: Midjourney, Stable Diffusion, Flux, Photoshop Firefly)
- Génération Vidéo & Animation (ex: Runway, Sora, Pika, Luma Dream Machine)
- Traitement de Texte & Scripting (ex: Claude, GPT, Gemini)
- Montage, Recoupage & Post-production (ex: DaVinci Resolve, Premiere Pro, Opus Clip, Adobe Podcast pour le son)

## 2. PIPELINE DE PRODUCTION (Le Workflow pas-à-pas)
Décris le processus linéaire optimal pour transformer une idée en produit fini.
- Étape 1 : Idéation & Scripting (comment l'IA analyse une tendance, écrit le script et génère les prompts visuels correspondants)
- Étape 2 : Production des Assets (génération parallèle des images, voix-off IA et plans vidéo)
- Étape 3 : Montage & Derushage IA (automatisation de la coupe des blancs, synchronisation audio/vidéo)
- Étape 4 : Déclinaison cross-canal (recoupage intelligent d'une vidéo longue de 10 min en 5 Shorts/Reels verticaux avec sous-titres dynamiques)

## 3. PROMPTS MAÎTRES ET TEMPLATES (L'opérationnel)
Fournis 3 "Prompts Maîtres" réutilisables :
- Un prompt de Scripting/Découpage : qui prend un sujet et sort un script à deux colonnes (Audio / Description Visuelle pour l'IA)
- Un prompt d'Ingénierie d'Image : un template pour générer des images ultra-réalistes et cohérentes d'une scène à l'autre
- Un prompt de Recoupage (Hooks) : pour analyser un texte long et identifier les 3 moments au fort potentiel viral pour les formats courts

## 4. CONSEILS PRO & OPTIMISATION (La "Plus-Value")
Donne tes secrets d'expert pour :
- Assurer la cohérence visuelle et des personnages (Consistency) à travers plusieurs générations d'images/vidéos
- Optimiser les coûts (crédits d'API vs abonnements) en respectant le budget indiqué
- Gérer le stockage et le versioning des fichiers volumineux

Adopte un ton d'expert, direct, ultra-professionnel et orienté "productivité maximale". Évite les généralités, donne des configurations et des méthodes concrètes. Réponds en français, en markdown (titres ##, ###, listes -, **gras**).`;
}

export async function streamArchitectBlueprint(
  idea: string,
  niche: string,
  budget: BudgetLevel
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return demoStream(idea, niche, budget);

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildArchitectPrompt(idea, niche, budget) }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok || !res.body) return demoStream(idea, niche, budget);

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
          // ligne partielle
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ---- Mode démo : blueprint complet, crédible et actionnable ----
function demoStream(
  idea: string,
  niche: string,
  budget: BudgetLevel
): ReadableStream<Uint8Array> {
  const budgetLine =
    budget === "eco"
      ? "Stack calibrée bootstrapping : open-source d'abord, abonnements uniquement là où le ROI est immédiat."
      : budget === "premium"
        ? "Stack calibrée performance maximale : les meilleurs outils du marché, redondance sur les étapes critiques."
        : "Stack équilibrée : abonnements clés + API à la consommation pour absorber les pics de production.";

  const text = `# BLUEPRINT — Studio IA « Pipeline Unifié »
**Projet : ${idea}** · Niche : ${niche || "tech généraliste"}
${budgetLine}

## 1. ARCHITECTURE DES OUTILS (La "Tech Stack")

### Génération & Édition d'Images
- **Flux (via API fal.ai ou Replicate)** : générations photoréalistes rapides, coût au rendu — votre cheval de bataille quotidien.
- **Midjourney** : direction artistique haut de gamme, moodboards et vignettes hero.
- **Photoshop + Firefly** : retouches finales, extensions de cadre (generative expand) pour adapter un visuel 16:9 en 9:16.

### Génération Vidéo & Animation
- **Runway Gen-3** : plans B-roll cinématiques de 5-10 s à partir des images clés (image-to-video = cohérence garantie).
- **Luma Dream Machine** : alternatives rapides et transitions morphing.
- **Pika** : effets stylisés et animations de texte/logo.

### Traitement de Texte & Scripting
- **Claude (Anthropic)** : scripts longs, structure narrative, ton de marque — le rédacteur en chef.
- **Gemini** : recherche de tendances multimodale + déclinaisons rapides (titres, descriptions, hashtags).
- **Votre ViralRepo.AI** : détection des sujets qui explosent AVANT la concurrence (radar GitHub) + scripts courts calibrés par plateforme.

### Montage, Recoupage & Post-production
- **DaVinci Resolve (Studio)** : montage principal — la Magic Mask et le Voice Isolation remplacent une équipe de post-prod.
- **Opus Clip** : recoupage automatique long → courts avec scoring viral par segment.
- **Adobe Podcast Enhance** : nettoyage audio broadcast en un glisser-déposer.
- **ElevenLabs** : voix off multilingues + clonage de votre voix pour l'échelle.

## 2. PIPELINE DE PRODUCTION (Le Workflow pas-à-pas)

### Étape 1 — Idéation & Scripting (30 min)
- Le radar de tendances sort les 5 sujets les plus chauds de la niche (vélocité, pas volume : ce qui MONTE, pas ce qui est déjà saturé).
- L'IA rédige le script maître en deux colonnes (Audio / Visuel) — voir Prompt Maître n°1.
- La colonne Visuel EST déjà la liste de prompts image : zéro ressaisie, zéro friction.

### Étape 2 — Production des Assets (en parallèle, 45 min)
- File A : génération des 15-25 images clés (Flux) avec seed et style verrouillés.
- File B : voix off ElevenLabs à partir de la colonne Audio (un fichier par section = synchro facile).
- File C : image-to-video Runway sur les 5 plans les plus importants uniquement (les images fixes + zoom Ken Burns suffisent pour le reste — économie de 70 % de crédits).

### Étape 3 — Montage & Derushage IA (1 h)
- Import dans DaVinci : détection des silences et coupe automatique (Edit > Detect Silence).
- Synchronisation par section grâce au nommage normalisé \`S01_audio.wav / S01_img01.png\` (voir Pilier 4).
- Colorimétrie : un seul PowerGrade appliqué à toute la timeline = signature visuelle constante.

### Étape 4 — Déclinaison cross-canal (20 min)
- La vidéo 10 min passe dans Opus Clip → 5 verticaux 9:16 sous-titrés (sous-titres dynamiques mot-à-mot, 3 mots max à l'écran).
- Chaque Short reprend le hook identifié par le Prompt Maître n°3 — jamais le début chronologique de la vidéo.
- Miniatures générées dans votre module Miniatures IA : même visage/mascotte, même palette, texte ≤ 4 mots.

## 3. PROMPTS MAÎTRES ET TEMPLATES (L'opérationnel)

### Prompt Maître n°1 — Scripting/Découpage
> Tu es scénariste senior de vidéos YouTube à forte rétention. Sujet : [SUJET]. Durée cible : [X] min. Sors un tableau à 2 colonnes : **AUDIO** (texte à dire, phrases ≤ 15 mots, une idée par phrase) et **VISUEL** (prompt image en anglais, style constant : [STYLE]). Structure : hook (0-15 s) → promesse → 3 sections avec re-hooks toutes les 45 s → payoff → CTA. Marque chaque re-hook par 🔁.

### Prompt Maître n°2 — Ingénierie d'Image
> [SUJET DE LA SCÈNE], cinematic photography, 35mm lens, shallow depth of field, volumetric lighting, color palette: [3 COULEURS HEX], consistent character: [DESCRIPTION PHYSIQUE COMPLÈTE EN 15 MOTS TOUJOURS IDENTIQUE], --seed [SEED FIXE] --ar 16:9
> Règle d'or : la description du personnage et la seed ne changent JAMAIS d'une image à l'autre ; seule la scène change.

### Prompt Maître n°3 — Recoupage (Hooks)
> Analyse ce script/transcription : [TEXTE]. Identifie les 3 segments au plus fort potentiel viral en les notant sur 10 selon : émotion (surprise/controverse), boucle ouverte (question sans réponse immédiate), valeur autonome (compréhensible sans contexte). Pour chacun : timecode, hook réécrit en ≤ 8 mots pour la première seconde, et suggestion de texte à l'écran.

## 4. CONSEILS PRO & OPTIMISATION (La "Plus-Value")

### Cohérence visuelle (Consistency)
- **Bible visuelle** : un document avec la description canonique du personnage (15 mots exacts), la palette (3 hex), la seed et le style — copiée-collée dans CHAQUE prompt.
- Générez un « character sheet » (6 angles du personnage) et utilisez-le en image de référence (Flux Redux / Midjourney --cref).
- Verrouillez le ratio : tout en 16:9 natif, recadrages 9:16 via generative expand — jamais l'inverse.

### Optimisation des coûts
- Règle 80/20 : API à la consommation (fal.ai, Replicate) pour l'itération, abonnements uniquement pour les outils utilisés chaque jour.
- Batching : générez les assets de 4 vidéos en une session — les coûts fixes (setup, style tests) s'amortissent.
- Ne payez l'image-to-video que pour les 20 % de plans qui portent l'émotion ; le reste en Ken Burns.

### Stockage & Versioning
- Arborescence stricte : \`/PROJET/AAAA-MM-JJ_sujet/01_script · 02_assets_img · 03_assets_audio · 04_video_brute · 05_exports\`
- Nommage : \`S01_v2_final.png\` — la version dans le nom, jamais « final_final ».
- NAS local + sync cloud sélective (uniquement 01, 02, 05) ; les rushes vidéo restent en local, archivés à J+30.

---
⚡ **Prochain pas concret** : produisez UNE vidéo pilote avec ce pipeline chronométré. Chaque friction rencontrée = un point à automatiser la semaine suivante. Au bout de 4 itérations, votre coût marginal par vidéo aura été divisé par 5.

*Mode démo : ajoutez GEMINI_API_KEY dans .env pour un blueprint généré sur mesure par Gemini pour « ${idea} ».*`;

  const words = text.split(/(?<= )/);
  const encoder = new TextEncoder();
  let i = 0;

  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) {
        controller.close();
        return;
      }
      await new Promise((r) => setTimeout(r, 8));
      controller.enqueue(encoder.encode(words[i]));
      i++;
    },
  });
}
