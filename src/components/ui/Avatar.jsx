// Initials avatar. No user images exist in this system (Core has no access to
// Auth's profile data), so initials on a deterministic gradient are the honest
// option — and they stay stable per person because the hue is derived from the name.
const GRADIENTS = [
  "from-brand-500 to-violet-500",
  "from-mint-400 to-sky-600",
  "from-peach-400 to-blush-600",
  "from-sky-400 to-brand-500",
  "from-violet-400 to-blush-400",
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hueIndex(seed = "") {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return sum % GRADIENTS.length;
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export default function Avatar({ name, seed, size = "md", className = "" }) {
  const gradient = GRADIENTS[hueIndex(seed ?? name ?? "")];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white/70 ${gradient} ${SIZES[size]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
