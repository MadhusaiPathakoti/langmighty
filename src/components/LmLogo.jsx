import lmIcon from "../media/lm-icon.png";

// lm-icon.png has an opaque white background baked in (no transparency), so
// it's framed in a white chip rather than placed directly on dark
// backgrounds — otherwise it shows as a stray white square in dark mode.
// `className` sizes/positions this outer chip, not the image itself.
export default function LmLogo({ className = "" }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-md bg-white p-0.5 ${className}`}>
      <img src={lmIcon} alt="LangMighty logo" className="w-full h-full object-contain rounded-sm" />
    </span>
  );
}
