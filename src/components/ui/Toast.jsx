import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, glyph: "text-mint-600", bar: "bg-mint-400" },
  error: { icon: AlertCircle, glyph: "text-rose-500", bar: "bg-rose-500" },
  info: { icon: Info, glyph: "text-brand-500", bar: "bg-brand-500" },
};

let nextId = 0;

// Transient confirmation for actions whose result would otherwise be invisible —
// e.g. a member removed from a table simply disappears with no acknowledgement.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, tone = "success", ttl = 4500) => {
      const id = (nextId += 1);
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map(({ id, message, tone }) => {
            const { icon: Icon, glyph, bar } = TONES[tone] ?? TONES.info;
            return (
              <div
                key={id}
                className="glass-strong animate-slide-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-[16px] py-3 pl-4 pr-9"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
                <Icon size={17} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${glyph}`} />
                <p className="min-w-0 text-sm leading-relaxed text-ink-700">{message}</p>
                <button
                  onClick={() => dismiss(id)}
                  aria-label="Dismiss"
                  className="absolute right-2.5 top-2.5 rounded-full p-1 text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700"
                >
                  <X size={13} strokeWidth={2.4} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
