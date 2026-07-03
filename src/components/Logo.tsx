// Emblème ViralRepo.AI — inspiré du logo 3D fourni (anneau + réseau neuronal +
// spirale/vortex + cœur « AI »), recréé en SVG vectoriel et harmonisé avec la
// palette néon de la plateforme (cyan → violet → fuchsia). Net à toute taille,
// fond transparent.

export function Logo({
  className = "h-9 w-9",
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ViralRepo.AI"
    >
      <defs>
        <linearGradient id="vrEmb" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
        <radialGradient id="vrCore" cx="0.5" cy="0.42" r="0.6">
          <stop stopColor="#3b2d75" />
          <stop offset="1" stopColor="#120a2e" />
        </radialGradient>
        {glow && (
          <filter id="vrGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? "url(#vrGlow)" : undefined}>
        {/* Anneau extérieur */}
        <circle cx="32" cy="32" r="28" stroke="url(#vrEmb)" strokeWidth="1.6" opacity="0.45" />
        <circle cx="32" cy="32" r="25.5" stroke="url(#vrEmb)" strokeWidth="2.4" />

        {/* Réseau neuronal : liaisons entre nœuds (hexagone + diagonales) */}
        <g stroke="url(#vrEmb)" strokeWidth="1" opacity="0.5">
          <path d="M32 6.5 L55.4 18.5 L55.4 45.5 L32 57.5 L8.6 45.5 L8.6 18.5 Z" />
          <path d="M32 6.5 L32 57.5 M8.6 18.5 L55.4 45.5 M55.4 18.5 L8.6 45.5" />
        </g>

        {/* Spirale / vortex : 3 pales néon pivotées à 120° */}
        <g>
          <path
            d="M32 32 C 29 21, 35 14, 45 17 C 39 21, 37 26, 32 32 Z"
            fill="url(#vrEmb)"
            opacity="0.95"
          />
          <path
            d="M32 32 C 29 21, 35 14, 45 17 C 39 21, 37 26, 32 32 Z"
            fill="#22d3ee"
            opacity="0.85"
            transform="rotate(120 32 32)"
          />
          <path
            d="M32 32 C 29 21, 35 14, 45 17 C 39 21, 37 26, 32 32 Z"
            fill="#e879f9"
            opacity="0.85"
            transform="rotate(240 32 32)"
          />
        </g>

        {/* Nœuds sur l'anneau */}
        <g>
          {[
            [32, 6.5],
            [55.4, 18.5],
            [55.4, 45.5],
            [32, 57.5],
            [8.6, 45.5],
            [8.6, 18.5],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="2.6"
              fill={i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a78bfa" : "#e879f9"}
            />
          ))}
        </g>

        {/* Cœur « AI » */}
        <circle cx="32" cy="32" r="11" fill="url(#vrCore)" stroke="url(#vrEmb)" strokeWidth="1.8" />
        <text
          x="32"
          y="36.3"
          textAnchor="middle"
          fontFamily="'Space Grotesk', system-ui, sans-serif"
          fontSize="11.5"
          fontWeight="700"
          fill="#ffffff"
        >
          AI
        </text>
      </g>
    </svg>
  );
}
