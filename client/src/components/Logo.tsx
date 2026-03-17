export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Web3Work logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon background */}
      <polygon
        points="16,2 28,9 28,23 16,30 4,23 4,9"
        fill="hsl(43,88%,49%)"
      />
      {/* W letterform */}
      <path
        d="M9 12 L11.5 21 L14 15 L16 19 L18 15 L20.5 21 L23 12"
        stroke="hsl(220,15%,6%)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function LogoFull({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-bold text-foreground" style={{ fontSize: size * 0.6 }}>
        Web3<span className="text-primary">Work</span>
      </span>
    </div>
  );
}
