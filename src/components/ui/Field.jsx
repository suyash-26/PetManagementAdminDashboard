import { ChevronDown } from "lucide-react";

const BASE =
  "w-full rounded-[12px] border border-ink-200/80 bg-white/70 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 backdrop-blur transition-all duration-200 focus-ring disabled:cursor-not-allowed disabled:bg-ink-100/60 disabled:text-ink-400";

export function Label({ children, required, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-semibold text-ink-700"
    >
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

export function Hint({ children }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{children}</p>;
}

// Wraps label + control + hint so vertical rhythm is identical on every form.
export function Field({ label, required, hint, htmlFor, className = "", children }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

export function Input({ icon: Icon, className = "", ...props }) {
  if (!Icon) return <input className={`${BASE} ${className}`} {...props} />;

  return (
    <div className="relative">
      <Icon
        size={16}
        strokeWidth={2.1}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <input className={`${BASE} pl-10 ${className}`} {...props} />
    </div>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${BASE} resize-y ${className}`} {...props} />;
}

// Native select, restyled — the chevron is ours so it matches across browsers.
export function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        className={`${BASE} cursor-pointer appearance-none pr-10 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={2.2}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}
