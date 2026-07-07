// Configuration des modules Montageiv IA — chaque module est déclaratif :
// ses champs sont rendus dynamiquement, ajouter un outil = ajouter une entrée.

import {
  Image as ImageIcon, Clapperboard, Music, Mic2, UserSquare2, PenLine,
  type LucideIcon,
} from "lucide-react";

export type Field =
  | { kind: "select"; key: string; label: string; options: { v: string; l: string }[]; def: string }
  | { kind: "toggle"; key: string; label: string; def?: boolean }
  | { kind: "number"; key: string; label: string; min: number; max: number; def: number }
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "image"; key: string; label: string };

export type ModuleDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  cost: number;
  tagline: string;
  greeting: string; // sous-titre du hero « Bonjour, … ? »
  action: string; // libellé de la pastille (ex. « Créer une image »)
  promptLabel: string;
  promptPlaceholder: string;
  cta: string;
  main: Field[]; // champs visibles directement
  advanced: Field[]; // repliés dans « Paramètres avancés »
};

export const MODULES: ModuleDef[] = [
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    cost: 4,
    tagline: "Génération & édition d'images IA",
    greeting: "Vous voulez décrire une image ?",
    action: "Créer une image",
    promptLabel: "Décrivez votre image",
    promptPlaceholder: "Un robot néon codant dans une salle serveur cyberpunk, éclairage cinématique…",
    cta: "Générer",
    main: [
      { kind: "image", key: "reference", label: "Image de référence" },
      {
        kind: "select", key: "model", label: "Modèle IA", def: "nano-banana-pro",
        options: [
          { v: "nano-banana-pro", l: "Nano Banana Pro" },
          { v: "nano-banana", l: "Nano Banana" },
          { v: "seedream-4", l: "Seedream 4" },
          { v: "imagen-4", l: "Imagen 4" },
          { v: "flux-1.1-pro", l: "FLUX 1.1 Pro" },
          { v: "flux-dev", l: "FLUX Dev" },
          { v: "flux-schnell", l: "FLUX Schnell (rapide)" },
          { v: "ideogram-v3-turbo", l: "Ideogram v3 Turbo (texte net)" },
          { v: "recraft-v3", l: "Recraft v3 (design)" },
          { v: "sd-3.5", l: "Stable Diffusion 3.5" },
          { v: "qwen-image", l: "Qwen Image" },
        ],
      },
      {
        kind: "select", key: "ratio", label: "Ratio", def: "16:9",
        options: [{ v: "16:9", l: "16:9" }, { v: "9:16", l: "9:16" }, { v: "1:1", l: "1:1" }],
      },
      { kind: "number", key: "count", label: "Nombre d'images", min: 1, max: 4, def: 1 },
    ],
    advanced: [
      { kind: "text", key: "style", label: "Style", placeholder: "cinématique, aquarelle, 3D…" },
      { kind: "text", key: "personnage", label: "Caractère", placeholder: "description du personnage récurrent" },
      { kind: "text", key: "objet", label: "Objet", placeholder: "objet à inclure" },
      {
        kind: "select", key: "quality", label: "Qualité", def: "standard",
        options: [{ v: "standard", l: "Standard" }, { v: "hd", l: "HD" }, { v: "ultra", l: "Ultra" }],
      },
      { kind: "text", key: "negative", label: "Prompt négatif", placeholder: "flou, texte, watermark…" },
      { kind: "number", key: "seed", label: "Seed", min: 0, max: 99999, def: 0 },
      { kind: "number", key: "cfg", label: "CFG", min: 1, max: 20, def: 7 },
      {
        kind: "select", key: "speed", label: "Vitesse", def: "equilibre",
        options: [{ v: "rapide", l: "Rapide" }, { v: "equilibre", l: "Équilibré" }, { v: "precis", l: "Précis" }],
      },
      { kind: "toggle", key: "upscale", label: "Upscale" },
      { kind: "toggle", key: "restoreFace", label: "Restore Face" },
      { kind: "toggle", key: "enhancePrompt", label: "Enhance Prompt", def: true },
    ],
  },
  {
    id: "video",
    label: "Vidéo",
    icon: Clapperboard,
    cost: 20,
    tagline: "Génération vidéo & animation",
    greeting: "Vous voulez décrire une vidéo ?",
    action: "Créer une vidéo",
    promptLabel: "Décrivez votre plan vidéo",
    promptPlaceholder: "Travelling lent sur une ville futuriste au coucher du soleil…",
    cta: "Générer la vidéo",
    main: [
      {
        kind: "select", key: "mode", label: "Mode", def: "texte",
        options: [
          { v: "texte", l: "Texte → Vidéo" },
          { v: "image", l: "Image → Vidéo" },
          { v: "video", l: "Vidéo → Vidéo" },
        ],
      },
      { kind: "image", key: "image", label: "Image source (Image → Vidéo)" },
      {
        kind: "select", key: "ratio", label: "Ratio", def: "16:9",
        options: [{ v: "16:9", l: "16:9" }, { v: "9:16", l: "9:16" }],
      },
      { kind: "number", key: "duree", label: "Durée (s)", min: 3, max: 10, def: 5 },
    ],
    advanced: [
      { kind: "toggle", key: "motionBrush", label: "Motion Brush" },
      {
        kind: "select", key: "camera", label: "Camera Control", def: "auto",
        options: [
          { v: "auto", l: "Auto" }, { v: "zoom", l: "Zoom" },
          { v: "pan", l: "Pan" }, { v: "orbit", l: "Orbite" },
        ],
      },
      { kind: "toggle", key: "interpolation", label: "Interpolation" },
      { kind: "toggle", key: "frameExtension", label: "Frame Extension" },
      { kind: "toggle", key: "slowMotion", label: "Slow Motion" },
      { kind: "toggle", key: "upscale", label: "Upscale" },
      { kind: "toggle", key: "animation", label: "Animation renforcée" },
    ],
  },
  {
    id: "musique",
    label: "Musique",
    icon: Music,
    cost: 10,
    tagline: "Composition musicale IA",
    greeting: "Vous voulez décrire votre musique ?",
    action: "Générateur de musique",
    promptLabel: "Décrivez votre morceau",
    promptPlaceholder: "Une mélodie électro inspirante pour une intro YouTube tech…",
    cta: "Composer",
    main: [
      {
        kind: "select", key: "genre", label: "Genre", def: "electro",
        options: [
          { v: "electro", l: "Électro" }, { v: "cinematique", l: "Cinématique" },
          { v: "lofi", l: "Lo-fi" }, { v: "afrobeat", l: "Afrobeat" }, { v: "pop", l: "Pop" },
        ],
      },
      {
        kind: "select", key: "ambiance", label: "Ambiance", def: "energique",
        options: [
          { v: "energique", l: "Énergique" }, { v: "calme", l: "Calme" },
          { v: "sombre", l: "Sombre" }, { v: "epique", l: "Épique" },
        ],
      },
      { kind: "number", key: "tempo", label: "Tempo (BPM)", min: 60, max: 180, def: 100 },
      { kind: "number", key: "duree", label: "Durée (s)", min: 4, max: 12, def: 8 },
    ],
    advanced: [
      {
        kind: "select", key: "langue", label: "Langue", def: "fr",
        options: [{ v: "fr", l: "Français" }, { v: "en", l: "Anglais" }],
      },
      { kind: "text", key: "instrument", label: "Instrument principal", placeholder: "piano, synthé, kora…" },
      { kind: "toggle", key: "instrumental", label: "Version instrumentale", def: true },
      { kind: "toggle", key: "chantee", label: "Version chantée" },
      { kind: "toggle", key: "parolesAuto", label: "Paroles automatiques" },
    ],
  },
  {
    id: "voix",
    label: "Voix",
    icon: Mic2,
    cost: 2,
    tagline: "Voix IA ultra-réalistes",
    greeting: "Quel texte dois-je lire ?",
    action: "Créer une voix",
    promptLabel: "Texte à dire",
    promptPlaceholder: "Collez ou écrivez le texte à transformer en voix…",
    cta: "Générer la voix",
    main: [
      {
        kind: "select", key: "voice", label: "Voix", def: "charlotte",
        options: [
          { v: "charlotte", l: "Charlotte (F)" },
          { v: "antoni", l: "Antoni (H)" },
          { v: "rachel", l: "Rachel (F)" },
        ],
      },
    ],
    advanced: [
      { kind: "toggle", key: "voixPerso", label: "Créer une voix personnalisée (bientôt)" },
      { kind: "toggle", key: "clonage", label: "Cloner ma voix (bientôt)" },
    ],
  },
  {
    id: "avatar",
    label: "Avatar",
    icon: UserSquare2,
    cost: 15,
    tagline: "Avatars parlants animés",
    greeting: "Créons votre avatar parlant ?",
    action: "Créer un avatar",
    promptLabel: "Texte que l'avatar doit dire",
    promptPlaceholder: "Bonjour et bienvenue sur ma chaîne !…",
    cta: "Créer l'avatar",
    main: [
      { kind: "image", key: "avatarUrl", label: "Photo de l'avatar" },
      {
        kind: "select", key: "style", label: "Style", def: "realiste",
        options: [
          { v: "realiste", l: "Réaliste" }, { v: "anime", l: "Animé" }, { v: "3d", l: "3D" },
        ],
      },
      {
        kind: "select", key: "animation", label: "Animation", def: "parlant",
        options: [{ v: "parlant", l: "Avatar parlant" }, { v: "expressif", l: "Expressif" }],
      },
    ],
    advanced: [],
  },
  {
    id: "redacteur",
    label: "Rédacteur en chef",
    icon: PenLine,
    cost: 1,
    tagline: "Assistant rédactionnel complet",
    greeting: "Que dois-je rédiger pour vous ?",
    action: "Rédiger",
    promptLabel: "Sujet ou texte source",
    promptPlaceholder: "Sujet de l'article, texte à corriger/traduire/résumer…",
    cta: "Rédiger",
    main: [
      {
        kind: "select", key: "type", label: "Type de contenu", def: "blog",
        options: [
          { v: "blog", l: "Blog" }, { v: "email", l: "Email" }, { v: "seo", l: "SEO" },
          { v: "publicite", l: "Publicité" }, { v: "instagram", l: "Instagram" },
          { v: "tiktok", l: "TikTok" }, { v: "facebook", l: "Facebook" },
          { v: "youtube", l: "YouTube" }, { v: "linkedin", l: "LinkedIn" },
          { v: "resume", l: "Résumé" }, { v: "correction", l: "Correction" },
          { v: "traduction", l: "Traduction" }, { v: "reecriture", l: "Réécriture" },
        ],
      },
      {
        kind: "select", key: "ton", label: "Ton", def: "professionnel",
        options: [
          { v: "professionnel", l: "Professionnel" }, { v: "amical", l: "Amical" },
          { v: "persuasif", l: "Persuasif" }, { v: "humoristique", l: "Humoristique" },
        ],
      },
    ],
    advanced: [
      {
        kind: "select", key: "langue", label: "Langue", def: "français",
        options: [{ v: "français", l: "Français" }, { v: "anglais", l: "Anglais" }],
      },
      {
        kind: "select", key: "longueur", label: "Longueur", def: "moyenne",
        options: [{ v: "courte", l: "Courte" }, { v: "moyenne", l: "Moyenne" }, { v: "longue", l: "Longue" }],
      },
    ],
  },
];

export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
