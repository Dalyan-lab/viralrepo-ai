"use client";

// Lecteur audio persistant en bas de Montageiv IA (comme dans la maquette).
// Fonctionnel : construit une playlist à partir des créations « musique » de
// l'utilisateur. Sans piste jouable, il affiche l'état démo « Sombra ».

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music } from "lucide-react";

type Track = { id: string; name: string; url?: string };

const DEMO: Track = { id: "demo-sombra", name: "Sombra" };

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([DEMO]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(178); // 2:58 par défaut (état démo)
  const [vol, setVol] = useState(0.8);
  const [hidden, setHidden] = useState(false);

  const track = tracks[i] ?? DEMO;
  const playable = !!track.url;

  // Charge les musiques générées comme playlist.
  useEffect(() => {
    fetch("/api/montageiv/creations?module=musique")
      .then((r) => r.json())
      .then((d) => {
        const list: Track[] = (d.creations ?? [])
          .filter((c: any) => c.resultUrl)
          .map((c: any) => ({ id: c.id, name: c.name || "Sans titre", url: c.resultUrl }));
        if (list.length) setTracks(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = vol;
  }, [vol, i]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !playable) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => {});
    }
  };

  const step = (d: number) => {
    if (tracks.length < 2) return;
    setI((v) => (v + d + tracks.length) % tracks.length);
    setPlaying(false);
    setCur(0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !playable || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * dur;
  };

  if (hidden) return null;
  const pct = dur ? Math.min(100, (cur / dur) * 100) : 55;

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 lg:left-60">
      <div className="mx-3 mb-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/70 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
        <audio
          ref={audioRef}
          src={track.url}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => step(1)}
        />

        {/* Pochette + titre */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-red-700 to-rose-900 text-white shadow-inner">
            <Music size={15} />
          </span>
          <span className="truncate text-sm font-medium">{track.name}</span>
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => step(-1)} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-[var(--fg)] disabled:opacity-30" disabled={tracks.length < 2}>
            <SkipBack size={16} />
          </button>
          <button
            onClick={toggle}
            disabled={!playable}
            title={playable ? "" : "Aucune musique générée à lire"}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--fg)] transition hover:scale-110 disabled:opacity-40"
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button onClick={() => step(1)} className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:text-[var(--fg)] disabled:opacity-30" disabled={tracks.length < 2}>
            <SkipForward size={16} />
          </button>
        </div>

        {/* Timeline */}
        <span className="hidden w-10 text-right text-xs tabular-nums text-muted sm:block">{fmt(cur)}</span>
        <div onClick={seek} className="group relative hidden h-1.5 flex-1 cursor-pointer rounded-full bg-white/15 sm:block">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition group-hover:opacity-100" style={{ left: `calc(${pct}% - 6px)` }} />
        </div>
        <span className="hidden w-10 text-xs tabular-nums text-muted sm:block">{fmt(dur)}</span>

        {/* Volume + fermer */}
        <div className="hidden items-center gap-2 md:flex">
          <Volume2 size={16} className="text-muted" />
          <input
            type="range" min={0} max={1} step={0.01} value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-violet-500"
          />
        </div>
        <button onClick={() => setHidden(true)} className="grid h-7 w-7 place-items-center rounded-full text-muted transition hover:text-[var(--fg)]" aria-label="Fermer">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
