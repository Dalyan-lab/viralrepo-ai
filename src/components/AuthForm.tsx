"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { FuturisticBackground } from "./FuturisticBackground";
import { Logo } from "./Logo";

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.05.78 2.13v3.16c0 .3.2.67.8.55A11.02 11.02 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const OAUTH_ERRORS: Record<string, string> = {
  oauth_unconfigured:
    "Ce mode de connexion n'est pas encore configuré (identifiants OAuth manquants dans .env).",
  oauth_failed: "La connexion a échoué. Réessayez.",
  provider: "Fournisseur inconnu.",
};

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    () => OAUTH_ERRORS[params.get("error") ?? ""] ?? ""
  );
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const resetOk = params.get("reset") === "ok";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <FuturisticBackground />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass neon-border w-full max-w-md rounded-3xl p-8"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <Logo className="h-10 w-10" />
          ViralRepo<span className="neon-text">.AI</span>
        </Link>

        <h1 className="text-center font-display text-2xl font-bold">
          {isLogin ? "Bon retour parmi nous 👋" : "Créez votre compte gratuit"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          {isLogin
            ? "Vos tendances virales vous attendent."
            : "30 secondes pour rejoindre les créateurs qui publient avant tout le monde."}
        </p>

        {/* Connexion sociale */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <a
            href="/api/auth/oauth/google"
            className="glass flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
          >
            <GoogleIcon /> Google
          </a>
          <a
            href="/api/auth/oauth/github"
            className="glass flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
          >
            <GitHubIcon /> GitHub
          </a>
        </div>

        <div className="mt-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-[var(--border)]" />
          ou par email
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        {resetOk && (
          <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            ✅ Mot de passe réinitialisé ! Connectez-vous.
          </p>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Alex Créateur"
                className="w-full rounded-xl glass px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vous@exemple.com"
              className="w-full rounded-xl glass px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mot de passe</label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="8 caractères minimum"
              className="w-full rounded-xl glass px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
            />
          </div>

          {isLogin && (
            <p className="text-right text-xs">
              <Link href="/forgot-password" className="text-muted hover:neon-text">
                Mot de passe oublié ?
              </Link>
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            disabled={loading}
            className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-60"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            {isLogin ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isLogin ? (
            <>
              Pas encore de compte ?{" "}
              <Link href="/register" className="neon-text font-semibold">
                Inscription gratuite
              </Link>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <Link href="/login" className="neon-text font-semibold">
                Connexion
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
