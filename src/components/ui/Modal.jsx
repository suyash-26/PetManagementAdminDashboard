import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Button from "./Button";

// Blurred backdrop + glass panel. Used for confirmations on destructive actions,
// which previously fired immediately with no chance to back out.
export default function Modal({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    // Stop the page behind from scrolling while the dialog owns the screen.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink-950/35 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-strong animate-pop relative w-full max-w-md rounded-[24px] p-6"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700"
        >
          <X size={17} strokeWidth={2.2} />
        </button>

        {title && (
          <h2 className="pr-8 text-lg font-bold tracking-tight text-ink-900">{title}</h2>
        )}
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
        )}
        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
