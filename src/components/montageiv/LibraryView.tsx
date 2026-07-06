"use client";

// Vue bibliothèque réutilisable : recherche, filtre par module, grille de
// créations. Sert Accueil (dernières), Bibliothèque, Favoris et Historique.

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { MODULES } from "./modules";
import { Creation, CreationCard } from "./CreationCard";

export function LibraryView({
  title,
  subtitle,
  favorite,
  deleted,
  compactFilters,
}: {
  title: string;
  subtitle: string;
  favorite?: boolean;
  deleted?: boolean;
  compactFilters?: boolean;
}) {
  const [creations, setCreations] = useState<Creation[] | null>(null);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("");
  const [showDeleted, setShowDeleted] = useState(!!deleted);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (mod) p.set("module", mod);
    if (favorite) p.set("favorite", "1");
    if (showDeleted) p.set("deleted", "1");
    const d = await fetch(`/api/montageiv/creations?${p}`).then((r) => r.json());
    setCreations(d.creations ?? []);
  }, [q, mod, favorite, showDeleted]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="glass flex min-w-56 flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:max-w-xs">
          <Search size={15} className="shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        {!compactFilters && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setMod("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mod === "" ? "btn-neon" : "glass text-muted"}`}
            >
              Tous
            </button>
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMod(m.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mod === m.id ? "btn-neon" : "glass text-muted"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        {deleted !== undefined && (
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${showDeleted ? "bg-red-500/20 text-red-400" : "glass text-muted"}`}
          >
            🗑️ Corbeille
          </button>
        )}
      </div>

      {creations === null ? (
        <div className="mt-16 grid place-items-center">
          <Loader2 size={24} className="animate-spin text-neon-violet" />
        </div>
      ) : creations.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted">
          Aucune création ici pour l'instant. Lancez un outil IA depuis la sidebar ! ✨
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {creations.map((c) => (
            <CreationCard key={c.id} creation={c} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
