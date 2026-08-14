import { NavLink } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Heart,
  Hotel,
  Inbox,
  LayoutDashboard,
  NotebookPen,
  PawPrint,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import Brand from "../Brand";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";

// `ready: false` marks a page whose backend module isn't built yet. They stay visible
// on purpose — the nav is the shape of the finished product, and a muted item with a
// "soon" tag is more honest than a link that appears out of nowhere later.
const NAV_SECTIONS = [
  {
    title: "Workspace",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true, ready: true },
      { to: "/dashboard/centers", label: "My Centers", icon: Building2, ready: true },
      { to: "/dashboard/members", label: "Team", icon: Users, ready: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/dashboard/requests", label: "Request Queue", icon: ClipboardList, ready: false },
      { to: "/dashboard/intake", label: "Intake", icon: Inbox, ready: false },
      { to: "/dashboard/custody", label: "Custody Roster", icon: PawPrint, ready: false },
      { to: "/dashboard/listings", label: "Adoption Listings", icon: Heart, ready: false },
      { to: "/dashboard/boarding", label: "Boarding", icon: Hotel, ready: false },
      { to: "/dashboard/care-logs", label: "Care Logs", icon: NotebookPen, ready: false },
    ],
  },
];

const PLATFORM_SECTION = {
  title: "Platform",
  items: [
    { to: "/dashboard/platform/centers", label: "Approve Centers", icon: ShieldCheck, ready: true },
    { to: "/dashboard/platform/users", label: "Users & Roles", icon: UserCog, ready: true },
  ],
};

export default function Sidebar({ onNavigate }) {
  const { user, isSuperAdmin } = useAuth();
  const sections = isSuperAdmin ? [...NAV_SECTIONS, PLATFORM_SECTION] : NAV_SECTIONS;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-5">
        <Brand />
      </div>

      {/* The nav scrolls on short viewports, so a fade at the bottom edge signals
          there's more below rather than leaving an item sliced in half. */}
      <div className="relative min-h-0 flex-1">
        <nav className="thin-scroll h-full space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive
                        ? "bg-gradient-to-r from-brand-500/[0.14] to-violet-500/[0.06] text-brand-600 shadow-[0_2px_10px_rgba(79,70,229,0.10)]"
                        : "text-ink-500 hover:bg-white/70 hover:text-ink-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active marker: a small gradient bar rather than filling the
                          whole row with a solid block. */}
                      <span
                        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-500 to-violet-500 transition-opacity duration-200 ${
                          isActive ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <item.icon
                        size={17}
                        strokeWidth={isActive ? 2.4 : 2}
                        className={`shrink-0 transition-transform duration-200 ${
                          isActive
                            ? "text-brand-500"
                            : "text-ink-400 group-hover:scale-110 group-hover:text-ink-700"
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {!item.ready && (
                        <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-400">
                          soon
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        </nav>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/70 to-transparent" />
      </div>

      {/* Identity anchored at the bottom, the way most SaaS consoles do it. */}
      <div className="border-t border-white/60 p-3">
        <div className="flex items-center gap-3 rounded-[14px] px-2 py-2">
          <Avatar name={user?.name} seed={user?.email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink-900">
              {user?.name || "Signed in"}
            </p>
            <p className="truncate text-[11px] text-ink-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
