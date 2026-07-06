"use client";

// Explorer : galerie d'inspiration — des idées organisées par univers,
// chaque carte pré-remplit l'outil correspondant.

import Link from "next/link";
import { motion } from "framer-motion";
import { moduleById } from "@/components/montageiv/modules";

const COLLECTIONS: { theme: string; items: { module: string; prompt: string }[] }[] = [
  {
    theme: "🌆 Univers cyberpunk",
    items: [
      { module: "image", prompt: "Ruelle cyberpunk sous la pluie, néons roses et cyans, reflets sur le bitume, cinématique" },
      { module: "video", prompt: "Plan drone traversant une mégalopole néon la nuit, pluie fine, ambiance Blade Runner" },
      { module: "musique", prompt: "Nappe synthwave sombre et pulsée, ambiance néon nocturne" },
    ],
  },
  {
    theme: "🌍 Afrique créative",
    items: [
      { module: "image", prompt: "Marché d'Abidjan au coucher du soleil, couleurs vives, style peinture numérique lumineuse" },
      { module: "musique", prompt: "Boucle afrobeat solaire et dansante, percussions organiques, kora" },
      { module: "redacteur", prompt: "Article de blog : la tech ivoirienne qui monte — startups et créateurs à suivre" },
    ],
  },
  {
    theme: "🚀 Business & création de contenu",
    items: [
      { module: "redacteur", prompt: "Script d'accroche TikTok : 3 outils IA qui font gagner 10 heures par semaine" },
      { module: "voix", prompt: "Bienvenue dans cette nouvelle vidéo ! Aujourd'hui, on découvre un outil qui va changer votre façon de créer." },
      { module: "image", prompt: "Bureau de créateur de contenu minimaliste, setup lumineux, plantes, profondeur de champ" },
    ],
  },
];

export default function ExplorerPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Explorer</h1>
      <p className="mt-1 text-sm text-muted">
        Des univers d'inspiration — cliquez sur une idée pour la lancer dans l'outil.
      </p>

      {COLLECTIONS.map((col, ci) => (
        <div key={col.theme} className="mt-8">
          <h2 className="font-display font-semibold">{col.theme}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {col.items.map((it, i) => {
              const mod = moduleById(it.module)!;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.1 + i * 0.05 }}
                >
                  <Link
                    href={`/montageiv/outils/${it.module}?prompt=${encodeURIComponent(it.prompt)}`}
                    className="glass neon-border group block h-full rounded-2xl p-4 transition-transform hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-muted">
                      <mod.icon size={14} className="text-neon-cyan" /> {mod.label}
                    </div>
                    <p className="mt-2 text-sm">{it.prompt}</p>
                    <span className="mt-3 inline-block text-xs font-semibold neon-text opacity-0 transition-opacity group-hover:opacity-100">
                      Utiliser cette idée →
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
