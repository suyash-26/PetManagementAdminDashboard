// The single surface primitive. `interactive` adds the shared lift-on-hover so
// clickable cards all move the same way.
export default function Card({
  as: Tag = "div",
  interactive = false,
  strong = false,
  padded = true,
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`rounded-[20px] ${strong ? "glass-strong" : "glass"} ${
        padded ? "p-5 sm:p-6" : ""
      } ${interactive ? "lift cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Soft tinted icon container. One accent per module keeps colour meaningful
// instead of decorative.
export const ACCENTS = {
  brand: "bg-brand-100 text-brand-600",
  violet: "bg-violet-400/15 text-violet-500",
  mint: "bg-mint-100 text-mint-600",
  peach: "bg-peach-100 text-peach-600",
  blush: "bg-blush-100 text-blush-600",
  sky: "bg-sky-100 text-sky-600",
  slate: "bg-ink-100 text-ink-500",
};

export function IconBubble({ icon: Icon, accent = "brand", size = "md", className = "" }) {
  const box = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const glyph = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[14px] ${box} ${ACCENTS[accent]} ${className}`}
    >
      <Icon size={glyph} strokeWidth={2.1} />
    </span>
  );
}
