"use client";

import { motion } from "framer-motion";
import { Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CommunautePage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass neon-border max-w-md rounded-3xl p-10 text-center"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl btn-neon">
          <Users size={24} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">Communauté</h1>
        <p className="mt-2 text-sm text-muted">
          Bientôt : partagez vos créations, découvrez celles des autres créateurs
          et remixez les meilleures idées de la communauté Montageiv.
        </p>
        <Link
          href="/montageiv/explorer"
          className="btn-neon mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          <Sparkles size={15} /> En attendant, explorez les inspirations
        </Link>
      </motion.div>
    </div>
  );
}
