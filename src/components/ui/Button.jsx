import { Loader2 } from "lucide-react";

// One button, four intents. Every clickable action in the app goes through this so
// hover/active/disabled/loading behave identically everywhere.
const VARIANTS = {
  primary:
    "text-white bg-gradient-to-br from-brand-500 to-violet-500 shadow-[0_6px_18px_rgba(79,70,229,0.28)] hover:shadow-[0_10px_26px_rgba(79,70,229,0.36)] hover:brightness-[1.06]",
  secondary:
    "text-ink-700 bg-white/70 backdrop-blur border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-white hover:border-ink-200",
  ghost: "text-ink-500 hover:text-ink-900 hover:bg-ink-900/[0.05]",
  danger:
    "text-white bg-gradient-to-br from-rose-500 to-rose-600 shadow-[0_6px_18px_rgba(244,63,94,0.26)] hover:brightness-[1.06]",
  success:
    "text-white bg-gradient-to-br from-mint-400 to-mint-600 shadow-[0_6px_18px_rgba(52,211,153,0.28)] hover:brightness-[1.06]",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-[10px]",
  md: "text-sm px-4 py-2.5 gap-2 rounded-[12px]",
  lg: "text-[15px] px-5 py-3 gap-2 rounded-[14px]",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
        active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none
        disabled:active:scale-100 disabled:hover:brightness-100
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : (
        Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight size={size === "sm" ? 14 : 16} strokeWidth={2.2} />
      )}
    </button>
  );
}
