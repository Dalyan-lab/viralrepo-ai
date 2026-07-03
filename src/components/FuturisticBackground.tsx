"use client";

// Fond futuriste : grille animée + orbes lumineux flottants.
export function FuturisticBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg animate-grid-move" />
      <div
        className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full blur-[140px] animate-float-slow"
        style={{ background: "var(--glow-1)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full blur-[160px] animate-float-slow"
        style={{ background: "var(--glow-2)", animationDelay: "-3s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full blur-[130px] animate-float-slow"
        style={{ background: "rgba(232,121,249,.18)", animationDelay: "-5s" }}
      />
    </div>
  );
}
