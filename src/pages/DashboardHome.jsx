import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Heart,
  Hotel,
  Inbox,
  PawPrint,
  Plus,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Alert, SkeletonCard } from "../components/ui/Feedback";
import { CENTER_STATUS_LABELS, MEMBER_ROLE_LABELS } from "../constants/labels";
import { useAuth } from "../context/AuthContext";
import { useCenter } from "../context/CenterContext";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Only actions whose backend exists get a live card; the rest are shown muted so the
// shape of the finished product is visible without pretending it works.
const QUICK_ACTIONS = [
  {
    to: "/dashboard/centers/new",
    icon: Building2,
    accent: "brand",
    title: "Register a center",
    body: "Add another facility to your account.",
    ready: true,
  },
  {
    to: "/dashboard/members",
    icon: Users,
    accent: "violet",
    title: "Manage your team",
    body: "Invite owners and staff, or remove people.",
    ready: true,
  },
  {
    to: "/dashboard/requests",
    icon: ClipboardList,
    accent: "sky",
    title: "Review requests",
    body: "One queue for intake, adoption and boarding.",
    ready: true,
  },
  {
    to: "/dashboard/custody",
    icon: PawPrint,
    accent: "mint",
    title: "Custody roster",
    body: "Every animal currently in your care.",
    ready: false,
  },
];

export default function DashboardHome() {
  const { user, isSuperAdmin } = useAuth();
  const { loading, hasAnyCenter, activeCenter, activeMembership, memberships } = useCenter();

  if (loading) {
    return (
      <div>
        <div className="glass mb-6 h-40 rounded-[24px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Onboarding state. A brand-new account holds no center_members row, which by the
  // v2 rules means it isn't a center admin at all — so the only useful action is to
  // create a center, which grants an OWNER membership in the same transaction.
  if (!hasAnyCenter) {
    return (
      <div className="animate-rise">
        <Hero
          name={user?.name}
          subtitle="Let's get your organisation set up."
          isSuperAdmin={isSuperAdmin}
        />

        <Card className="mt-6 overflow-hidden text-center" padded={false}>
          <div className="relative px-6 py-16">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-100/50 to-transparent" />
            <span className="relative mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-brand-500 to-violet-500 opacity-90 shadow-[0_14px_36px_rgba(79,70,229,0.32)]" />
              <Building2 size={32} strokeWidth={2} className="relative text-white" />
            </span>

            <h2 className="relative text-2xl font-extrabold tracking-tight text-ink-900">
              Your center starts here
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
              Registering a care center makes you its owner straight away. A platform
              super admin reviews it before it goes live and can start accepting
              requests from pet owners.
            </p>

            <Link to="/dashboard/centers/new" className="relative mt-8 inline-block">
              <Button size="lg" icon={Plus}>
                Register a center
              </Button>
            </Link>

            <div className="relative mx-auto mt-10 grid max-w-lg gap-3 text-left sm:grid-cols-3">
              {[
                { n: "1", t: "Register", d: "Add your details" },
                { n: "2", t: "Get approved", d: "A super admin reviews" },
                { n: "3", t: "Go live", d: "Start taking requests" },
              ].map((step) => (
                <div
                  key={step.n}
                  className="rounded-[14px] border border-white/70 bg-white/50 px-3.5 py-3"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/12 text-[11px] font-extrabold text-brand-600">
                    {step.n}
                  </span>
                  <p className="mt-2 text-[13px] font-bold text-ink-900">{step.t}</p>
                  <p className="text-[12px] text-ink-400">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Hero
        name={user?.name}
        subtitle={
          activeCenter
            ? `Here's what's happening at ${activeCenter.name} today.`
            : "Select a center to get started."
        }
        isSuperAdmin={isSuperAdmin}
      />

      {activeCenter?.status !== "ACTIVE" && activeCenter && (
        <Alert
          tone="warning"
          className="mt-5"
          title={
            activeCenter.status === "PENDING"
              ? "Awaiting super-admin approval"
              : "This center is suspended"
          }
        >
          {activeCenter.status === "PENDING"
            ? "It won't appear in the public directory or accept requests until it's approved."
            : "It can't accept new requests until a super admin reinstates it."}
        </Alert>
      )}

      {activeCenter && (
        <>
          <div className="stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              accent="brand"
              label="Center status"
              value={<Badge status={activeCenter.status} labels={CENTER_STATUS_LABELS} />}
              foot={
                activeCenter.status === "ACTIVE"
                  ? "Visible in the public directory"
                  : "Not yet accepting requests"
              }
            />
            <StatCard
              icon={UserCog}
              accent="violet"
              label="Your role"
              value={
                activeMembership && (
                  <Badge status={activeMembership.memberRole} labels={MEMBER_ROLE_LABELS} />
                )
              }
              foot={
                activeMembership?.memberRole === "OWNER"
                  ? "You can manage the team"
                  : "Day-to-day operations"
              }
            />
            <StatCard
              icon={Hotel}
              accent="mint"
              label="Kennel capacity"
              value={
                <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink-900">
                  {activeCenter.capacity}
                </span>
              }
              foot="Boarding slots available"
            />
            <StatCard
              icon={Building2}
              accent="peach"
              label="Centers"
              value={
                <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink-900">
                  {memberships.length}
                </span>
              }
              foot={memberships.length === 1 ? "You administer one" : "You administer several"}
            />
          </div>

          <div className="mt-9">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink-900">
                  Quick actions
                </h2>
                <p className="mt-0.5 text-[13px] text-ink-400">
                  Jump straight into the work.
                </p>
              </div>
            </div>

            <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((action) => (
                <ActionCard key={action.to} {...action} />
              ))}
            </div>
          </div>

          <Card className="mt-9 overflow-hidden">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <IconBubble icon={Sparkles} accent="sky" size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-bold text-ink-900">Coming next</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  Intake, custody roster, adoption listings and boarding are still being
                  built on the backend. Their screens are already in the sidebar so you
                  can see where they&apos;ll live.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {[Inbox, Heart, Hotel].map((Icon, i) => (
                  <span
                    key={i}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/70 text-ink-400"
                  >
                    <Icon size={16} strokeWidth={2.1} />
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// A compact strip, not a landing banner: it sits directly under the top bar and shares
// its width, so the two read as one header block rather than two competing hero slabs.
// "Register a center" lives in the sidebar and in Quick actions — it isn't repeated here.
function Hero({ name, subtitle, isSuperAdmin }) {
  return (
    <Card className="animate-rise relative overflow-hidden" padded={false}>
      {/* A faint paw motif and one blob — enough depth to not read as a plain bar. */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/16 to-violet-500/10 blur-3xl" />
      <PawPrint
        size={116}
        strokeWidth={1}
        className="pointer-events-none absolute -right-3 -top-3 rotate-12 text-brand-500/[0.05]"
      />

      <div className="relative px-5 py-4 sm:px-6 sm:py-[18px]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="min-w-0 text-[19px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[21px]">
            {greeting()}, {name?.split(" ")[0] ?? "there"}{" "}
            <span className="inline-block">👋</span>
          </h1>
          {isSuperAdmin && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">
              <ShieldCheck size={12} strokeWidth={2.6} />
              Super admin
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{subtitle}</p>
      </div>
    </Card>
  );
}

function StatCard({ icon, accent, label, value, foot }) {
  return (
    <Card className="lift">
      <IconBubble icon={icon} accent={accent} />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
        {label}
      </p>
      <div className="mt-2 flex min-h-[30px] items-center">{value}</div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">{foot}</p>
    </Card>
  );
}

function ActionCard({ to, icon, accent, title, body, ready }) {
  return (
    <Link to={to} className="group block">
      <Card className="lift flex h-full flex-col">
        <div className="flex items-start justify-between">
          <IconBubble icon={icon} accent={accent} />
          {!ready && (
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-400">
              soon
            </span>
          )}
        </div>
        <h3 className="mt-4 text-[15px] font-bold tracking-tight text-ink-900">{title}</h3>
        <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-500">{body}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-500 transition-all duration-200 group-hover:gap-2.5">
          Open
          <ArrowRight size={14} strokeWidth={2.5} />
        </span>
      </Card>
    </Link>
  );
}
