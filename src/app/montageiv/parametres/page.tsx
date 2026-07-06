"use client";

// Paramètres Montageiv : préférences de génération (enregistrées localement).

import { useEffect, useState } from "react";
import { Settings, Check } from "lucide-react";

type Prefs = { ratio: string; quality: string; langue: string; ton: string };
const DEFAULTS: Prefs = { ratio: "16:9", quality: "standard", langue: "français", ton: "professionnel" };

export default function ParametresPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("montageiv-prefs");
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem("montageiv-prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Select = ({ k, label, options }: { k: keyof Prefs; label: string; options: string[] }) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <select
        value={prefs[k]}
        onChange={(e) => setPrefs((p) => ({ ...p, [k]: e.target.value }))}
        className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="max-w-xl">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <Settings size={22} className="text-neon-cyan" /> Paramètres
      </h1>
      <p className="mt-1 text-sm text-muted">Vos préférences par défaut pour les générations.</p>

      <div className="glass neon-border mt-6 grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
        <Select k="ratio" label="Ratio par défaut" options={["16:9", "9:16", "1:1"]} />
        <Select k="quality" label="Qualité par défaut" options={["standard", "hd", "ultra"]} />
        <Select k="langue" label="Langue de rédaction" options={["français", "anglais"]} />
        <Select k="ton" label="Ton rédactionnel" options={["professionnel", "amical", "persuasif", "humoristique"]} />
      </div>

      <button onClick={save} className="btn-neon mt-4 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
        {saved ? <Check size={15} /> : null}
        {saved ? "Enregistré !" : "Enregistrer mes préférences"}
      </button>
    </div>
  );
}
