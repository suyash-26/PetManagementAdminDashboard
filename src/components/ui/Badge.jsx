// Status pill with a leading dot. The dot carries the semantic colour so the pill
// itself can stay light and not shout from across the page.
const DOTS = {
  "bg-amber-100 text-amber-700": "bg-amber-500",
  "bg-emerald-100 text-emerald-700": "bg-emerald-500",
  "bg-rose-100 text-rose-700": "bg-rose-500",
  "bg-indigo-100 text-indigo-700": "bg-indigo-500",
  "bg-sky-100 text-sky-700": "bg-sky-500",
  "bg-slate-100 text-slate-700": "bg-slate-400",
  "bg-slate-100 text-slate-600": "bg-slate-400",
  "bg-violet-100 text-violet-700": "bg-violet-500",
};

export default function Badge({ status, labels, dot = true, className = "" }) {
  const meta = labels?.[status] ?? {
    label: status,
    color: "bg-slate-100 text-slate-700",
  };
  const dotColor = DOTS[meta.color] ?? "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${meta.color} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {meta.label}
    </span>
  );
}
