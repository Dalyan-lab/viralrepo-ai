"use client";

// Aperçu Reel vertical (9:16) : le créateur visualise le rendu final
// avant de tourner — légendes incrustées façon karaoké, voix off TTS
// synchronisée, dégradé animé.

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { lineDurations } from "@/lib/exportVideo";

type Props = {
  lines: string[];
  repoName: string;
  badge: string;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  userAudioUrl?: string | null;
};

export function ReelPreview({
  lines,
  repoName,
  badge,
  ttsEnabled,
  onToggleTts,
  userAudioUrl,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  useEffect(() => stop, [stop]);
  useEffect(() => {
    stop();
    setIdx(0);
  }, [lines.length, stop]);

  const speakLine = useCallback(
    (i: number) => {
      if (i >= lines.length) {
        setPlaying(false);
        setIdx(0);
        return;
      }
      setIdx(i);
      const u = new SpeechSynthesisUtterance(lines[i]);
      u.lang = "fr-FR";
      u.rate = 1.05;
      const fr = window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.startsWith("fr"));
      if (fr) u.voice = fr;
      u.onend = () => speakLine(i + 1);
      u.onerror = () => speakLine(i + 1);
      window.speechSynthesis.speak(u);
    },
    [lines]
  );

  const playTimed = useCallback(
    (i: number) => {
      if (i >= lines.length) {
        setPlaying(false);
        setIdx(0);
        return;
      }
      setIdx(i);
      const d = lineDurations(lines)[i] * 1000;
      timerRef.current = setTimeout(() => playTimed(i + 1), d);
    },
    [lines]
  );

  const togglePlay = () => {
    if (playing) {
      stop();
      return;
    }
    if (lines.length === 0) return;
    setPlaying(true);
    if (userAudioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      playTimed(0);
    } else if (ttsEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      speakLine(0);
    } else {
      playTimed(0);
    }
  };

  const progress = lines.length ? ((idx + (playing ? 0.5 : 0)) / lines.length) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Cadre téléphone */}
      <div className="relative aspect-[9/16] w-[280px] overflow-hidden rounded-[2rem] border-4 border-[var(--border)] shadow-[0_0_60px_-10px_rgba(139,92,246,.5)]">
        {/* fond animé */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #12142e 0%, #251a4d 45%, #3b1149 100%)",
          }}
        />
        <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-cyan-500/25 blur-3xl animate-float-slow" />
        <div className="absolute -right-14 bottom-24 h-48 w-48 rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slow" style={{ animationDelay: "-3s" }} />

        {/* contenu */}
        <div className="relative flex h-full flex-col items-center px-4 py-6 text-center text-white">
          <span className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-[10px] font-extrabold tracking-wide">
            🔥 {badge}
          </span>
          <p className="mt-3 max-w-full truncate font-display text-sm font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,.8)]">
            {repoName}
          </p>

          <div className="flex flex-1 items-center justify-center px-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={idx + (lines[idx] ?? "")}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="font-display text-lg font-bold leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,.9)]"
                style={{ textShadow: "0 0 18px rgba(167,139,250,.8)" }}
              >
                {lines[idx] ?? "Générez un script pour voir l'aperçu ✨"}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="w-full">
            <p className="mb-2 text-[10px] text-white/60">
              {lines.length ? `${idx + 1} / ${lines.length}` : "—"}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] font-medium text-white/40">
              créé avec ViralRepo.AI ⚡
            </p>
          </div>
        </div>
      </div>

      {userAudioUrl && <audio ref={audioRef} src={userAudioUrl} className="hidden" />}

      {/* contrôles */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={lines.length === 0}
          className="btn-neon flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          {playing ? "Pause" : "Lire l'aperçu"}
        </button>
        <button
          onClick={onToggleTts}
          title="Voix off TTS synchronisée"
          className={`glass flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            ttsEnabled ? "neon-text" : "text-muted"
          }`}
        >
          {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          Voix off TTS
        </button>
      </div>
    </div>
  );
}
