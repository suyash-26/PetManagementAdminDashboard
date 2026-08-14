import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Calendar, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import UserMenu from "./UserMenu";
import Brand from "../Brand";
import CenterSwitcher from "../CenterSwitcher";
import { Alert } from "../ui/Feedback";
import { useCenter } from "../../context/CenterContext";

export default function DashboardLayout() {
  const { error } = useCenter();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on navigation — otherwise it stays open over the page
  // you just moved to.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1440px] gap-0 lg:gap-6 lg:px-6 lg:py-6">
        {/* Desktop: a floating panel that sticks alongside the scrolling content,
            rather than a full-height slab welded to the window edge. */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[264px] shrink-0 overflow-hidden rounded-[22px] lg:block glass">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-ink-950/35 backdrop-blur-[6px]"
              onClick={() => setNavOpen(false)}
            />
            <aside className="glass-strong animate-slide-in absolute inset-y-0 left-0 w-[272px] overflow-hidden rounded-r-[22px]">
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="absolute right-3 top-5 rounded-full p-1.5 text-ink-400 transition hover:bg-ink-900/5 hover:text-ink-700"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
              <Sidebar onNavigate={() => setNavOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* A contained glass bar rather than controls floating over the background, so
              its edges line up with the cards below it. lg:top-6 matches the sidebar's
              own sticky offset — both then come to rest on the same line when scrolled. */}
          <header className="sticky top-0 z-30 mb-5 px-4 pt-3 lg:top-6 lg:mb-6 lg:px-0 lg:pt-0">
            <div className="glass flex items-center justify-between gap-3 rounded-[18px] px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <button
                  onClick={() => setNavOpen(true)}
                  aria-label="Open navigation"
                  className="rounded-[10px] p-2 text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
                >
                  <Menu size={19} strokeWidth={2.2} />
                </button>
                <Brand />
              </div>

              {/* The sidebar carries the brand on desktop, so this slot shows today's
                  date — it keeps the bar from reading as a lopsided strip of controls. */}
              <p className="hidden items-center gap-2 pl-1 text-[13px] font-semibold text-ink-500 lg:flex">
                <Calendar size={15} strokeWidth={2.2} className="text-ink-400" />
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <CenterSwitcher />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-16 lg:px-0">
            {/* Surfaced app-wide: if memberships can't load, every center-scoped page
                below is empty for a reason the page itself can't explain. */}
            {error && (
              <Alert tone="warning" className="mb-5" title="Couldn't load your centers">
                {error}
              </Alert>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
