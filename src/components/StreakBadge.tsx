"use client";

// Badge de série compact pour la navbar (🔥 + nombre de jours).

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";

export function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => setStreak(typeof d.streak === "number" ? d.streak : null))
      .catch(() => {});
  }, [pathname]);

  if (streak === null) return null;

  return (
    <span
      title={`Série de ${streak} jour(s)`}
      className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold sm:flex ${
        streak > 0 ? "bg-orange-500/15 text-orange-400" : "glass text-muted"
      }`}
    >
      <Flame size={14} className={streak > 0 ? "text-orange-400" : "text-muted"} />
      {streak}
    </span>
  );
}
