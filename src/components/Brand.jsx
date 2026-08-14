import { PawPrint } from "lucide-react";

// The wordmark. Gradient paw tile + two-tone type — "Pet" in ink, "Mgmt" in brand,
// so the name reads as one brand rather than a generic app title.
export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br from-brand-500 to-violet-500 shadow-[0_6px_16px_rgba(79,70,229,0.32)]">
        <PawPrint size={18} strokeWidth={2.4} className="text-white" />
      </span>
      {!compact && (
        <span className="whitespace-nowrap text-[17px] font-extrabold leading-none tracking-tight text-ink-900">
          Pet<span className="text-brand-500">Mgmt</span>
          {/* The "Admin" suffix is the first thing to go on a narrow header, where the
              centre switcher and avatar need the room more than the wordmark does. */}
          <span className="ml-1.5 hidden align-middle text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400 sm:inline">
            Admin
          </span>
        </span>
      )}
    </div>
  );
}
