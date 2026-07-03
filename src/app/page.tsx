"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radar, Sparkles, Clapperboard, Mic2, UserSquare2, Image as ImageIcon,
  Zap, TrendingUp, Star, ArrowRight, Check, Flame, Share2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

const FEATURES = [
  {
    icon: Radar,
    title: "Radar IA temps réel",
    desc: "Scanne GitHub en continu et repère les dépôts IA en pleine explosion, classés par vitesse de croissance (étoiles/jour).",
  },
  {
    icon: Sparkles,
    title: "Script viral en 1 clic",
    desc: "Gemini 3.1 Pro rédige votre script en streaming mot-à-mot, calibré TikTok, Reels, Shorts ou YouTube long format.",
  },
  {
    icon: Clapperboard,
    title: "Aperçu Reel vertical",
    desc: "Visualisez le rendu final avant de tourner : maquette 9:16 animée avec le texte incrusté à l'écran, façon karaoké.",
  },
  {
    icon: Zap,
    title: "Export MP4 sans montage",
    desc: "Un clic génère un vrai fichier MP4 vertical depuis l'aperçu (canvas + ffmpeg.wasm). Prêt à publier, zéro logiciel de montage.",
  },
  {
    icon: Mic2,
    title: "Voix off synchronisée",
    desc: "Voix off TTS générée automatiquement et synchronisée avec les légendes — ou importez votre propre voix.",
  },
  {
    icon: UserSquare2,
    title: "Avatar qui parle",
    desc: "Créez ou importez votre avatar : un présentateur animé avec lip-sync (D-ID), rendu en file d'attente sans vous bloquer.",
  },
  {
    icon: ImageIcon,
    title: "Miniatures percutantes",
    desc: "Générez des miniatures cliquables pour YouTube et vos posts en quelques secondes, directement dans l'app.",
  },
  {
    icon: Share2,
    title: "Partage direct",
    desc: "Exportez vers X, TikTok, YouTube ou en .txt. Votre contenu part en ligne pendant que la tendance est chaude.",
  },
];

const STEPS = [
  { n: "01", title: "Détectez", desc: "Le radar classe les repos IA qui explosent — badge EXPLOSIF à l'appui." },
  { n: "02", title: "Générez", desc: "Choisissez la plateforme, l'IA écrit le script viral en direct sous vos yeux." },
  { n: "03", title: "Visualisez", desc: "L'aperçu Reel vertical anime votre script avec les légendes incrustées." },
  { n: "04", title: "Publiez", desc: "Export MP4 avec voix off, avatar parlant, miniature — et partage direct." },
];

const PRICING = [
  {
    name: "Découverte",
    price: "0€",
    period: "pour toujours",
    features: ["Radar IA temps réel", "3 scripts / jour", "Aperçu Reel vertical", "Export .txt"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Créateur",
    price: "19€",
    period: "/ mois",
    features: [
      "Scripts illimités",
      "Export MP4 vertical HD",
      "Voix off TTS + import voix",
      "Miniatures illimitées",
      "Partage direct X / TikTok / YouTube",
    ],
    cta: "Devenir viral",
    highlight: true,
  },
  {
    name: "Studio",
    price: "49€",
    period: "/ mois",
    features: [
      "Tout le plan Créateur",
      "Avatar parlant lip-sync (D-ID)",
      "File d'attente prioritaire",
      "Multi-comptes équipe",
      "Support prioritaire",
    ],
    cta: "Passer en mode Studio",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <FuturisticBackground />
      <Navbar />

      {/* ---- HERO ---- */}
      <section className="relative mx-auto max-w-7xl px-5 pt-16 pb-24 text-center md:pt-20">
        {/* Rendu 3D de la marque en médaillon flottant */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <div className="relative animate-float-slow">
            <div
              className="absolute inset-0 -z-10 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(167,139,250,.55), transparent 70%)" }}
            />
            <div
              className="absolute -inset-2 rounded-full opacity-70 animate-spin-slow"
              style={{
                background: "conic-gradient(from 0deg, #22d3ee, #a78bfa, #e879f9, #22d3ee)",
                filter: "blur(7px)",
              }}
            />
            <div className="relative h-40 w-40 overflow-hidden rounded-full border border-white/10 shadow-[0_0_70px_-10px_rgba(139,92,246,.85)] md:h-56 md:w-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-3d.png"
                alt="Emblème 3D ViralRepo.AI"
                className="h-full w-full scale-[1.12] object-cover"
              />
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeUp} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium animate-pulse-glow">
          <Flame size={13} className="text-orange-400" />
          <span className="neon-text font-semibold">NOUVEAU</span>
          <span className="text-muted">Export MP4 + avatar parlant intégrés</span>
        </motion.div>

        <motion.h1
          {...fadeUp}
          className="mx-auto max-w-4xl font-display text-4xl font-bold leading-tight md:text-6xl"
        >
          Les repos IA <span className="neon-text">explosent</span>.<br />
          Soyez le premier à en faire des <span className="shimmer-text">vidéos virales</span>.
        </motion.h1>

        <motion.p {...fadeUp} transition={{ delay: 0.15, duration: 0.6 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          ViralRepo.AI scanne GitHub en temps réel, détecte les dépôts IA en pleine
          explosion et génère en un clic un script vidéo viral — avec aperçu Reel,
          voix off, avatar parlant et export MP4 prêt à publier.
        </motion.p>

        <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.6 }} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn-neon group flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold">
            Créer ma première vidéo virale
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/dashboard" className="glass neon-border rounded-xl px-7 py-3.5 font-semibold transition-transform hover:scale-[1.02]">
            Voir le radar en action
          </Link>
        </motion.div>

        {/* Statistiques sociales */}
        <motion.div {...fadeUp} transition={{ delay: 0.45, duration: 0.6 }} className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, value: "+2 400", label: "repos IA analysés / jour" },
            { icon: Clapperboard, value: "30 sec", label: "de l'idée au script prêt" },
            { icon: Star, value: "×12", label: "de reach en surfant la tendance" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4">
              <s.icon size={18} className="mx-auto mb-2 text-neon-cyan" />
              <div className="font-display text-2xl font-bold neon-text">{s.value}</div>
              <div className="mt-1 text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <motion.h2 {...fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl">
          Tout le pipeline viral, <span className="neon-text">dans une seule app</span>
        </motion.h2>
        <motion.p {...fadeUp} className="mx-auto mt-4 max-w-xl text-center text-muted">
          De la détection de tendance à la vidéo publiée : plus besoin de 6 outils différents.
        </motion.p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="glass neon-border group rounded-2xl p-6 transition-transform hover:-translate-y-1.5"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl btn-neon transition-transform group-hover:scale-110">
                <f.icon size={20} />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- COMMENT ÇA MARCHE ---- */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <motion.h2 {...fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl">
          De la tendance à la vidéo en <span className="neon-text">4 étapes</span>
        </motion.h2>
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative glass rounded-2xl p-6"
            >
              <span className="font-display text-4xl font-bold neon-text opacity-60">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-neon-violet md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- PRICING ---- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <motion.h2 {...fadeUp} className="text-center font-display text-3xl font-bold md:text-4xl">
          Un prix simple, un <span className="neon-text">ROI viral</span>
        </motion.h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PRICING.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`glass rounded-2xl p-7 ${
                p.highlight ? "neon-border animate-pulse-glow md:-translate-y-3" : ""
              }`}
            >
              {p.highlight && (
                <div className="mb-3 inline-block rounded-full btn-neon px-3 py-1 text-xs font-bold">
                  LE PLUS POPULAIRE
                </div>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold neon-text">{p.price}</span>
                <span className="text-sm text-muted">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-neon-lime" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-7 block rounded-xl py-3 text-center font-semibold transition-transform hover:scale-[1.02] ${
                  p.highlight ? "btn-neon" : "glass neon-border"
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- CTA FINAL ---- */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <motion.div {...fadeUp} className="glass neon-border rounded-3xl p-12 animate-pulse-glow">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            La prochaine tendance IA explose <span className="neon-text">en ce moment même</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Chaque heure d'attente, c'est un créateur qui publie avant vous.
            Inscrivez-vous gratuitement — aucune carte bancaire requise.
          </p>
          <Link href="/register" className="btn-neon mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold">
            Lancer mon radar viral <Zap size={19} />
          </Link>
        </motion.div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="glass border-t border-[var(--border)] py-8 text-center text-sm text-muted">
        <p>
          © {new Date().getFullYear()} ViralRepo.AI — Détectez. Générez. Publiez.
          Devenez viral.
        </p>
      </footer>
    </>
  );
}
