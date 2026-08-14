import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

// Inline message strip. Replaces the ad-hoc coloured <p> tags that were repeated
// on every page, so error/success/warning always read the same.
const TONES = {
  error: {
    icon: AlertCircle,
    wrap: "border-rose-200/70 bg-rose-50/80 text-rose-800",
    glyph: "text-rose-500",
  },
  success: {
    icon: CheckCircle2,
    wrap: "border-mint-400/40 bg-mint-100/70 text-emerald-900",
    glyph: "text-mint-600",
  },
  warning: {
    icon: TriangleAlert,
    wrap: "border-amber-300/70 bg-amber-50/85 text-amber-900",
    glyph: "text-amber-500",
  },
  info: {
    icon: Info,
    wrap: "border-brand-200/80 bg-brand-50/80 text-brand-700",
    glyph: "text-brand-500",
  },
};

export function Alert({ tone = "info", title, children, className = "" }) {
  const { icon: Icon, wrap, glyph } = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`animate-pop flex items-start gap-3 rounded-[14px] border px-4 py-3 text-sm backdrop-blur ${wrap} ${className}`}
    >
      <Icon size={17} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${glyph}`} />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

// Full-bleed empty state: illustration, title, description, CTA. Used instead of
// a bare "nothing here" line so a legitimately empty screen never reads as broken.
export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div
      className={`glass animate-rise flex flex-col items-center rounded-[24px] px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <span className="relative mb-5 inline-flex h-20 w-20 items-center justify-center">
          {/* soft halo behind the glyph rather than a hard circle */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-100 to-violet-400/20 blur-[2px]" />
          <Icon size={30} strokeWidth={1.8} className="relative text-brand-500" />
        </span>
      )}
      <h3 className="text-lg font-bold tracking-tight text-ink-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Loading placeholders that match the shape of what's coming, so the layout
// doesn't jump when data lands.
export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-[10px] ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-[20px] p-6">
      <Skeleton className="h-11 w-11 rounded-[14px]" />
      <Skeleton className="mt-4 h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="glass overflow-hidden rounded-[20px] p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-[10px]" />
        </div>
      ))}
    </div>
  );
}
