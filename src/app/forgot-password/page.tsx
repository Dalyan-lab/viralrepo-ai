"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Copy, Check } from "lucide-react";
import { FuturisticBackground } from "@/components/FuturisticBackground";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || data.error || "");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <FuturisticBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass neon-border w-full max-w-md rounded-3xl p-8"
      >
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl btn-neon">
          <KeyRound size={20} />
        </div>
        <h1 className="text-center font-display text-2xl font-bold">
          Mot de passe oublié ?
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Entrez votre email : nous créons un lien sécurisé (30 min) pour
          récupérer votre compte.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
          />
          <button
            disabled={loading}
            className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Récupérer mon compte
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
            {message}
          </p>
        )}
        {resetUrl && (
          <div className="mt-3 space-y-2">
            <Link
              href={resetUrl}
              className="block truncate rounded-lg glass px-3 py-2 text-xs neon-text underline"
            >
              {resetUrl}
            </Link>
            <button
              onClick={copy}
              className="glass flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium"
            >
              {copied ? <Check size={13} className="text-neon-lime" /> : <Copy size={13} />}
              {copied ? "Copié !" : "Copier le lien"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="neon-text font-semibold">
            ← Retour à la connexion
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
