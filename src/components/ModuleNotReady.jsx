import { Link } from "react-router-dom";
import { ArrowLeft, Hammer } from "lucide-react";
import Card, { IconBubble } from "./ui/Card";

// Placeholder body for pages whose backend module doesn't exist yet. Each of these
// screens is real routing and real layout — only the data call is missing — so wiring
// them later means replacing this component with a table, not building a page.
//
// `plannedEndpoints` is transcribed from v2 §8 so the contract is visible on screen
// while the backend is still being written.
export default function ModuleNotReady({ title, description, plannedEndpoints = [], owner }) {
  return (
    <Card className="animate-rise relative overflow-hidden">
      {/* faint construction-tape wash so the card reads as "pending" at a glance */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-peach-400/20 to-blush-400/10 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
        <IconBubble icon={Hammer} accent="peach" size="lg" />

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-ink-900">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            {description}
          </p>

          {owner && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-100/80 px-3 py-1 text-[11px] font-semibold text-ink-500">
              Backend track · {owner}
            </p>
          )}

          {plannedEndpoints.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                Planned endpoints
              </p>
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {plannedEndpoints.map((endpoint) => (
                  <li
                    key={endpoint}
                    className="rounded-[10px] border border-white/70 bg-white/55 px-3 py-2 font-mono text-[11.5px] text-ink-600"
                  >
                    {endpoint}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition hover:gap-2.5 hover:text-brand-600"
          >
            <ArrowLeft size={15} strokeWidth={2.4} />
            Back to overview
          </Link>
        </div>
      </div>
    </Card>
  );
}
