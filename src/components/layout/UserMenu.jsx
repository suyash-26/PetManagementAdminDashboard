import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";

export default function UserMenu() {
  const { user, logout, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click and on Escape — a dropdown that only closes by
  // re-clicking the trigger feels broken.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 py-1 pl-1 pr-2.5 backdrop-blur transition-all duration-200 hover:bg-white hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
      >
        <Avatar name={user?.name} seed={user?.email} size="sm" />
        <span className="hidden max-w-[8rem] truncate text-[13px] font-semibold text-ink-700 sm:inline">
          {user?.name?.split(" ")[0]}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={`text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="glass-strong animate-pop absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-[18px] p-1.5"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user?.name} seed={user?.email} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{user?.email}</p>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-[10px] bg-brand-50 px-2.5 py-1.5">
              <ShieldCheck size={13} strokeWidth={2.4} className="text-brand-500" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                Super admin
              </span>
            </div>
          )}

          <div className="my-1 h-px bg-ink-200/60" />

          <button
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-[13px] font-semibold text-ink-600 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={15} strokeWidth={2.2} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
