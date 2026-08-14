import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
          {/* On desktop the sidebar already carries the brand, so a full-width bar
              would just be an empty strip — the controls float top-right instead.
              On mobile it stays a solid bar because it also holds the menu button. */}
          <header className="glass-bar sticky top-0 z-30 mb-5 flex items-center justify-between gap-3 px-4 py-3 lg:mb-4 lg:justify-end lg:px-0">
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

            <div className="flex items-center gap-2 sm:gap-3">
              <CenterSwitcher />
              <UserMenu />
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
