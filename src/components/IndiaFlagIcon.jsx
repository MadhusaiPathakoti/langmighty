export default function IndiaFlagIcon({ className }) {
  return (
    <svg viewBox="0 0 36 24" className={className} role="img" aria-label="Flag of India">
      <rect width="36" height="8" y="0" fill="#FF9933" />
      <rect width="36" height="8" y="8" fill="#FFFFFF" />
      <rect width="36" height="8" y="16" fill="#138808" />
      <g transform="translate(18 12)">
        <circle r="3.2" fill="none" stroke="#000080" strokeWidth="0.5" />
        <circle r="0.5" fill="#000080" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={3.2 * Math.cos((i * Math.PI) / 12)}
            y2={3.2 * Math.sin((i * Math.PI) / 12)}
            stroke="#000080"
            strokeWidth="0.25"
          />
        ))}
      </g>
    </svg>
  );
}
