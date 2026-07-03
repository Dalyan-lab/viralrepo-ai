"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";
import { FuturisticBackground } from "@/components/FuturisticBackground";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      router.push("/login?reset=ok");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass neon-border w-full max-w-md rounded-3xl p-8"
    >
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl btn-neon">
        <ShieldCheck size={20} />
      </div>
      <h1 className="text-center font-display text-2xl font-bold">
        Nouveau mot de passe
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Choisissez un nouveau mot de passe pour récupérer votre compte.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (8+ caractères)"
          className="w-full rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
        />
        <input
          required
          type="password"
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmez le mot de passe"
          className="w-full rounded-xl glass px-4 py-3 text-sm outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,.5)]"
        />
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}
        <button
          disabled={loading || !token}
          className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Valider et récupérer mon compte
        </button>
      </form>

      {!token && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          Lien invalide :{" "}
          <Link href="/forgot-password" className="underline">
            refaites une demande
          </Link>
          .
        </p>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <FuturisticBackground />
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>
  );
}
