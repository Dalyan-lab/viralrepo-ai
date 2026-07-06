"use client";

// Templates : modèles prêts à l'emploi — un clic pré-remplit l'outil concerné.

import Link from "next/link";
import { motion } from "framer-motion";
import { moduleById } from "@/components/montageiv/modules";

const TEMPLATES: { module: string; title: string; prompt: string }[] = [
  { module: "image", title: "Miniature YouTube tech", prompt: "Miniature YouTube percutante, style tech néon, personnage surpris pointant un écran de code, contraste élevé, cinématique" },
  { module: "image", title: "Visuel produit e-commerce", prompt: "Photo produit studio d'un objet high-tech sur fond dégradé, éclairage doux, ombres réalistes, très détaillé" },
  { module: "video", title: "Intro de chaîne", prompt: "Travelling aérien lent sur une ville futuriste au coucher du soleil, lumière volumétrique, style cinématique" },
  { module: "musique", title: "Intro YouTube énergique", prompt: "Mélodie électro énergique et moderne pour une intro de vidéo tech" },
  { module: "musique", title: "Fond lo-fi de travail", prompt: "Boucle lo-fi calme et chaleureuse pour vidéo de fond, ambiance détendue" },
  { module: "voix", title: "Annonce de lancement", prompt: "Grande nouvelle ! Notre nouvelle fonctionnalité est enfin disponible. Découvrez-la dès maintenant et dites-nous ce que vous en pensez." },
  { module: "avatar", title: "Présentateur de bienvenue", prompt: "Bonjour et bienvenue ! Ici, on parle d'intelligence artificielle, d'outils et d'automatisation. Abonnez-vous pour ne rien rater." },
  { module: "redacteur", title: "Post LinkedIn viral", prompt: "Les 5 leçons que j'ai apprises en automatisant ma création de contenu avec l'IA" },
  { module: "redacteur", title: "Description YouTube SEO", prompt: "Description YouTube optimisée pour une vidéo sur les meilleurs outils IA de l'année" },
];

export default function TemplatesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Templates</h1>
      <p className="mt-1 text-sm text-muted">
        Des modèles prêts à l'emploi — cliquez pour pré-remplir l'outil.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t, i) => {
          const mod = moduleById(t.module)!;
          return (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/montageiv/outils/${t.module}?prompt=${encodeURIComponent(t.prompt)}`}
                className="glass neon-border group block h-full rounded-2xl p-5 transition-transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg btn-neon transition-transform group-hover:scale-110">
                    <mod.icon size={16} />
                  </span>
                  <span className="text-xs font-bold text-muted">{mod.label}</span>
                </div>
                <h3 className="mt-3 font-display font-semibold">{t.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{t.prompt}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
