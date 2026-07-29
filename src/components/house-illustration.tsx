// Decorative isometric house — hand-authored SVG (no external image, no new dependency),
// consistent with the rest of the site's generated/illustrated visual language.
export function HouseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      aria-hidden
      className={className}
      style={{ filter: "drop-shadow(0 30px 40px rgb(0 0 0 / 0.15))" }}
    >
      <ellipse cx="150" cy="248" rx="92" ry="14" fill="#000" opacity="0.08" />

      {/* cube walls */}
      <polygon points="150,60 227,105 150,150 73,105" fill="#fde68a" />
      <polygon points="73,105 150,150 150,240 73,195" fill="#fdba74" />
      <polygon points="227,105 150,150 150,240 227,195" fill="#f97316" />

      {/* roof */}
      <polygon points="150,20 235,68 227,105 150,60" fill="#fca5a5" />
      <polygon points="150,20 65,68 73,105 150,60" fill="#fecaca" />

      {/* chimney */}
      <polygon points="188,38 205,47 205,75 188,66" fill="#94a3b8" />
      <polygon points="188,66 205,75 205,80 188,71" fill="#64748b" />

      {/* door on the dark (right) face */}
      <polygon points="163,206 190,222 190,240 163,224" fill="#7c2d12" />

      {/* window on the light (left) face */}
      <g>
        <polygon points="95,155 122,171 122,193 95,177" fill="#fef3c7" opacity="0.9" />
        <line x1="95" y1="166" x2="122" y2="182" stroke="#c2410c" strokeWidth="1.5" />
        <line x1="108.5" y1="148" x2="108.5" y2="185" stroke="#c2410c" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
