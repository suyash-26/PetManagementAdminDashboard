import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import Badge from "./ui/Badge";
import { CENTER_STATUS_LABELS } from "../constants/labels";
import { useCenter } from "../context/CenterContext";

// One admin can serve several centers (v2 §3), so "which center am I acting as?" is
// first-class app state rather than a URL param repeated on every page.
export default function CenterSwitcher() {
  const { memberships, centers, activeCenterId, setActiveCenterId } = useCenter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  if (memberships.length === 0) return null;

  const active = activeCenterId ? centers[activeCenterId] : null;

  // A single center needs no dropdown — just show where you are.
  if (memberships.length === 1) {
    return (
      <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/60 py-1.5 pl-2.5 pr-3.5 backdrop-blur sm:flex">
        <Building2 size={14} strokeWidth={2.3} className="text-brand-500" />
        <span className="max-w-[11rem] truncate text-[13px] font-semibold text-ink-700">
          {active?.name ?? "Loading…"}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 py-1.5 pl-2.5 pr-2.5 backdrop-blur transition-all duration-200 hover:bg-white hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
      >
        <Building2 size={14} strokeWidth={2.3} className="text-brand-500" />
        <span className="hidden max-w-[10rem] truncate text-[13px] font-semibold text-ink-700 sm:inline">
          {active?.name ?? "Select center"}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={`text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="glass-strong animate-pop absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-[18px] p-1.5"
        >
          <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            Acting as
          </p>
          {memberships.map((membership) => {
            const center = centers[membership.centerId];
            const isActive = membership.centerId === activeCenterId;

            return (
              <button
                key={membership.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setActiveCenterId(membership.centerId);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${
                  isActive ? "bg-brand-500/[0.10]" : "hover:bg-white/70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink-900">
                    {center?.name ?? membership.centerId}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {center && (
                      <Badge status={center.status} labels={CENTER_STATUS_LABELS} />
                    )}
                    <span className="text-[11px] text-ink-400">
                      {membership.memberRole === "OWNER" ? "Owner" : "Staff"}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <Check size={15} strokeWidth={2.6} className="shrink-0 text-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
