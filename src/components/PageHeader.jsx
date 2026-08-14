export default function PageHeader({ eyebrow, title, subtitle, action, className = "" }) {
  return (
    <div
      className={`animate-rise mb-6 flex flex-wrap items-start justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
