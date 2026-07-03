"use client";

// Espace admin : vue d'ensemble du SaaS + gestion complète des comptes.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, FileText, Clapperboard, Trash2, ArrowUp, ArrowDown, Loader2, PlugZap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { FuturisticBackground } from "@/components/FuturisticBackground";

type AdminData = {
  stats: { userCount: number; scriptCount: number; jobCount: number };
  users: {
    id: string;
    email: string;
    name: string;
    role: string;
    provider: string;
    createdAt: string;
    _count: { scripts: number; avatarJobs: number };
  }[];
  recentScripts: {
    id: string;
    repoName: string;
    platform: string;
    createdAt: string;
    user: { email: string };
  }[];
};

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin");
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (userId: string, action: "promote" | "demote" | "delete") => {
    if (action === "delete" && !confirm("Supprimer définitivement ce compte et toutes ses données ?")) return;
    setBusy(userId);
    try {
      await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <FuturisticBackground />
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 font-display text-3xl font-bold"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl btn-neon">
              <ShieldCheck size={21} />
            </span>
            Administration <span className="neon-text">totale</span>
          </motion.h1>
          <Link
            href="/admin/connexions"
            className="glass neon-border flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
          >
            <PlugZap size={16} className="text-neon-cyan" /> Connexions & API
          </Link>
        </div>

        {!data ? (
          <div className="mt-12 grid place-items-center">
            <Loader2 size={28} className="animate-spin text-neon-violet" />
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Users, label: "Utilisateurs", value: data.stats.userCount },
                { icon: FileText, label: "Scripts générés", value: data.stats.scriptCount },
                { icon: Clapperboard, label: "Rendus avatar", value: data.stats.jobCount },
              ].map((s) => (
                <div key={s.label} className="glass neon-border rounded-2xl p-5">
                  <s.icon size={18} className="text-neon-cyan" />
                  <div className="mt-2 font-display text-3xl font-bold neon-text">
                    {s.value}
                  </div>
                  <div className="text-sm text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Utilisateurs */}
            <div className="glass neon-border mt-8 overflow-x-auto rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold">Comptes utilisateurs</h2>
              <table className="mt-4 w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted">
                    <th className="pb-3">Utilisateur</th>
                    <th className="pb-3">Connexion</th>
                    <th className="pb-3">Rôle</th>
                    <th className="pb-3">Scripts</th>
                    <th className="pb-3">Avatars</th>
                    <th className="pb-3">Inscrit le</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)]">
                      <td className="py-3">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </td>
                      <td className="py-3 capitalize">{u.provider}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              : "glass"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">{u._count.scripts}</td>
                      <td className="py-3">{u._count.avatarJobs}</td>
                      <td className="py-3 text-xs text-muted">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          {u.role === "admin" ? (
                            <button
                              onClick={() => act(u.id, "demote")}
                              disabled={busy === u.id}
                              title="Rétrograder en utilisateur"
                              className="glass grid h-8 w-8 place-items-center rounded-lg hover:scale-105 disabled:opacity-40"
                            >
                              <ArrowDown size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => act(u.id, "promote")}
                              disabled={busy === u.id}
                              title="Promouvoir admin"
                              className="glass grid h-8 w-8 place-items-center rounded-lg hover:scale-105 disabled:opacity-40"
                            >
                              <ArrowUp size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => act(u.id, "delete")}
                            disabled={busy === u.id}
                            title="Supprimer le compte"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-red-400 hover:scale-105 disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Derniers scripts */}
            <div className="glass neon-border mt-8 rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold">Derniers scripts générés</h2>
              {data.recentScripts.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Aucun script pour l'instant.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.recentScripts.map((s) => (
                    <li
                      key={s.id}
                      className="glass flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <span className="font-semibold">{s.repoName}</span>
                      <span className="rounded-md glass px-2 py-0.5 text-xs capitalize">{s.platform}</span>
                      <span className="text-xs text-muted">{s.user.email}</span>
                      <span className="text-xs text-muted">
                        {new Date(s.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
