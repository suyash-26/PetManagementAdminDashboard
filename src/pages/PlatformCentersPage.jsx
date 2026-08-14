import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Hotel,
  MapPin,
  PauseCircle,
  Search,
  ShieldCheck,
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

// SUPER_ADMIN only — PATCH /centers/{id}/status.
//
// Known gap: the backend's GET /centers is the *public* feed and hardcodes
// status=ACTIVE, so there's no way to list PENDING centers awaiting approval. Until an
// admin-facing search endpoint exists, this page approves by center ID. The lookup and
// the status transitions are otherwise the finished flow.
export default function PlatformCentersPage() {
  const { toast } = useToast();
  const [activeCenters, setActiveCenters] = useState([]);
  const [lookupId, setLookupId] = useState("");
  const [lookedUp, setLookedUp] = useState(null);
  const [looking, setLooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [pendingSuspend, setPendingSuspend] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setActiveCenters(await centersApi.listPublicCenters());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setLookedUp(null);
    setLooking(true);
    try {
      setLookedUp(await centersApi.getCenter(lookupId.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLooking(false);
    }
  }

  async function changeStatus(centerId, status) {
    setError("");
    setWorking(true);
    try {
      const updated = await centersApi.updateCenterStatus(centerId, status);
      setLookedUp((current) => (current?.id === updated.id ? updated : current));
      setPendingSuspend(null);
      await refresh();
      toast(
        status === "ACTIVE"
          ? `${updated.name} is now active and visible to pet owners.`
          : `${updated.name} has been suspended.`,
      );
    } catch (err) {
      setError(err.message);
      setPendingSuspend(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Approve Centers"
        subtitle="Approving a center lets it accept intake, adoption and boarding requests, and lists it publicly for pet owners."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card className="animate-rise relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-brand-500/12 to-violet-500/8 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <IconBubble icon={ShieldCheck} accent="brand" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold tracking-tight text-ink-900">
              Look up a center
            </h2>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-400">
              Pending centers aren&apos;t listable yet — the public feed only returns
              active ones. Paste the ID the center owner sends you.
            </p>

            <form onSubmit={handleLookup} className="mt-4 flex flex-wrap gap-2.5">
              <div className="min-w-[15rem] flex-1">
                <Input
                  required
                  icon={Search}
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  className="font-mono text-[12.5px]"
                />
              </div>
              <Button type="submit" variant="secondary" loading={looking}>
                Look up
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {lookedUp && (
        <Card className="animate-pop mt-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <IconBubble icon={Building2} accent="violet" size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-bold tracking-tight text-ink-900">
                    {lookedUp.name}
                  </h3>
                  <Badge status={lookedUp.status} labels={CENTER_STATUS_LABELS} />
                </div>
                <p className="mt-1.5 text-[13px] text-ink-500">{lookedUp.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip icon={MapPin}>
                    {lookedUp.city}, {lookedUp.state}
                  </Chip>
                  <Chip icon={Hotel}>{lookedUp.capacity} slots</Chip>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-t border-white/60 pt-5">
            {/* Only legal transitions are offered — mirrors canTransition() in
                CareCenterService. Anything else comes back 409. */}
            {(ALLOWED_CENTER_TRANSITIONS[lookedUp.status] ?? []).map((target) =>
              target === "ACTIVE" ? (
                <Button
                  key={target}
                  variant="success"
                  icon={CheckCircle2}
                  loading={working}
                  onClick={() => changeStatus(lookedUp.id, target)}
                >
                  {lookedUp.status === "PENDING" ? "Approve center" : "Reinstate center"}
                </Button>
              ) : (
                <Button
                  key={target}
                  variant="danger"
                  icon={PauseCircle}
                  onClick={() => setPendingSuspend(lookedUp)}
                >
                  Suspend center
                </Button>
              ),
            )}
          </div>
        </Card>
      )}

      <div className="mb-4 mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink-900">Active centers</h2>
          <p className="mt-0.5 text-[13px] text-ink-400">
            Live on the platform and accepting requests.
          </p>
        </div>
        {!loading && activeCenters.length > 0 && (
          <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11px] font-bold text-mint-600">
            {activeCenters.length} active
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : activeCenters.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No active centers yet"
          description="Once you approve a pending center it'll appear here and become visible to pet owners."
        />
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2">
          {activeCenters.map((center) => (
            <Card key={center.id} className="lift flex flex-col">
              <div className="flex items-start gap-4">
                <IconBubble icon={Building2} accent="mint" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[15px] font-bold tracking-tight text-ink-900">
                      {center.name}
                    </h3>
                    <Badge status={center.status} labels={CENTER_STATUS_LABELS} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Chip icon={MapPin}>{center.city}</Chip>
                    <Chip icon={Hotel}>{center.capacity} slots</Chip>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end border-t border-white/60 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={PauseCircle}
                  className="hover:text-rose-600"
                  onClick={() => setPendingSuspend(center)}
                >
                  Suspend
                </Button>
              </div>
            </Card>
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
            ? `${pendingSuspend.name} will be removed from the public directory and can't accept new requests. You can reinstate it at any time.`
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
              loading={working}
              onClick={() => changeStatus(pendingSuspend.id, "SUSPENDED")}
            >
              Suspend center
            </Button>
          </>
        }
      />
    </div>
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
