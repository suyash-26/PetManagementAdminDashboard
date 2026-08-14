import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Hotel,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  Search,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as centersApi from "../api/centers";
import { ALLOWED_CENTER_TRANSITIONS, CENTER_STATUS_LABELS } from "../constants/labels";

// SUPER_ADMIN only.
//   GET   /centers/admin        — every center regardless of status
//   PATCH /centers/{id}/status  — the transitions below
//
// Every center is fetched once and grouped by status here rather than re-querying per
// tab: it keeps the tab counts honest (a per-tab fetch can only count its own tab) and
// makes switching tabs instant. The legal moves mirror canTransition() in
// CareCenterService — PENDING/SUSPENDED -> ACTIVE, ACTIVE -> SUSPENDED — so each tab
// offers exactly one action and anything the backend would 409 is never on screen.
const TABS = [
  {
    key: "PENDING",
    label: "Pending",
    empty: "Nothing waiting for review",
    emptyHint: "New centers appear here as soon as somebody registers one.",
  },
  {
    key: "ACTIVE",
    label: "Active",
    empty: "No active centers yet",
    emptyHint: "Approve a pending center and it'll show up here, visible to pet owners.",
  },
  {
    key: "SUSPENDED",
    label: "Suspended",
    empty: "No suspended centers",
    emptyHint: "Centers you take offline are listed here so you can reinstate them.",
  },
];

export default function PlatformCentersPage() {
  const { toast } = useToast();
  const [centers, setCenters] = useState([]);
  const [tab, setTab] = useState("PENDING");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [pendingSuspend, setPendingSuspend] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCenters(await centersApi.listAllCenters());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(
    () =>
      centers.reduce((acc, center) => {
        acc[center.status] = (acc[center.status] ?? 0) + 1;
        return acc;
      }, {}),
    [centers],
  );

  // Filtering is local — the list is already in memory, so hitting the server for a
  // substring match would only add latency.
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return centers.filter(
      (center) =>
        center.status === tab &&
        (!needle ||
          center.name?.toLowerCase().includes(needle) ||
          center.city?.toLowerCase().includes(needle) ||
          center.state?.toLowerCase().includes(needle)),
    );
  }, [centers, tab, filter]);

  async function changeStatus(center, status) {
    setError("");
    setWorkingId(center.id);
    try {
      const updated = await centersApi.updateCenterStatus(center.id, status);
      // Patch the row in place instead of refetching: the center moves to another tab,
      // and re-pulling the whole list would also reset the filter you're mid-way through.
      setCenters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setPendingSuspend(null);
      toast(
        status === "ACTIVE"
          ? `${updated.name} is now active and visible to pet owners.`
          : `${updated.name} has been suspended.`,
      );
    } catch (err) {
      setError(err.message);
      setPendingSuspend(null);
    } finally {
      setWorkingId(null);
    }
  }

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Manage Centers"
        subtitle="Approve, suspend and reinstate care centers. An active center accepts intake, adoption and boarding requests and is listed publicly for pet owners."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Center status"
          className="glass inline-flex gap-1 rounded-[14px] p-1"
        >
          {TABS.map((t) => {
            const selected = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-[13px] font-bold transition-all duration-200 ${
                  selected
                    ? "bg-white text-ink-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    selected ? "bg-brand-500/12 text-brand-600" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {loading ? "—" : (counts[t.key] ?? 0)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-w-[13rem] flex-1">
          <Input
            icon={Search}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, city or state"
            aria-label="Filter centers"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={filter.trim() ? "No centers match that filter" : activeTab.empty}
          description={
            filter.trim() ? "Try a different name, city or state." : activeTab.emptyHint
          }
          action={
            filter.trim() && (
              <Button variant="secondary" onClick={() => setFilter("")}>
                Clear filter
              </Button>
            )
          }
        />
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2">
          {visible.map((center) => (
            <CenterCard
              key={center.id}
              center={center}
              working={workingId === center.id}
              onApprove={() => changeStatus(center, "ACTIVE")}
              onSuspend={() => setPendingSuspend(center)}
            />
          ))}
        </div>
      )}

      {/* Suspension takes a live center offline for its users, so it's confirmed. */}
      <Modal
        open={Boolean(pendingSuspend)}
        onClose={() => setPendingSuspend(null)}
        title="Suspend this center?"
        description={
          pendingSuspend
            ? `${pendingSuspend.name} will be removed from the public directory and can't accept new requests. You can reinstate it at any time from the Suspended tab.`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingSuspend(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={PauseCircle}
              loading={workingId === pendingSuspend?.id}
              onClick={() => changeStatus(pendingSuspend, "SUSPENDED")}
            >
              Suspend center
            </Button>
          </>
        }
      />
    </div>
  );
}

const ACCENTS = { PENDING: "peach", ACTIVE: "mint", SUSPENDED: "blush" };

function CenterCard({ center, working, onApprove, onSuspend }) {
  return (
    <Card className="lift flex flex-col">
      <div className="flex items-start gap-4">
        <IconBubble icon={Building2} accent={ACCENTS[center.status] ?? "brand"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-ink-900">
              {center.name}
            </h3>
            <Badge status={center.status} labels={CENTER_STATUS_LABELS} />
          </div>
          {center.description && (
            <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-400">
              {center.description}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Chip icon={MapPin}>
              {[center.city, center.state].filter(Boolean).join(", ")}
            </Chip>
            <Chip icon={Hotel}>{center.capacity} slots</Chip>
            {center.contactPhone && <Chip icon={Phone}>{center.contactPhone}</Chip>}
            {center.contactEmail && <Chip icon={Mail}>{center.contactEmail}</Chip>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/60 pt-4">
        <span className="text-[11.5px] text-ink-400">
          {center.createdAt
            ? `Registered ${new Date(center.createdAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : ""}
        </span>

        {/* Driven by the mirrored transition table rather than an if/else on status, so
            the legal moves are defined in exactly one place. Today that yields a single
            button per tab; a new status added to the table gets its button for free. */}
        <div className="flex flex-wrap justify-end gap-2">
          {(ALLOWED_CENTER_TRANSITIONS[center.status] ?? []).map((target) =>
            target === "ACTIVE" ? (
              <Button
                key={target}
                variant="success"
                size="sm"
                icon={CheckCircle2}
                loading={working}
                onClick={onApprove}
              >
                {center.status === "PENDING" ? "Approve" : "Reinstate"}
              </Button>
            ) : (
              <Button
                key={target}
                variant="ghost"
                size="sm"
                icon={PauseCircle}
                className="hover:text-rose-600"
                onClick={onSuspend}
              >
                Suspend
              </Button>
            ),
          )}
        </div>
      </div>
    </Card>
  );
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-500">
      <Icon size={12} strokeWidth={2.3} />
      {children}
    </span>
  );
}
