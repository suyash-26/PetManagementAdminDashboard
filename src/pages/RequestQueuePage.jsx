import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Hotel,
  Inbox,
  PawPrint,
  ThumbsDown,
  XCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Field, Textarea } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as requestsApi from "../api/requests";
import { getPetsByIds } from "../api/pets";
import { REQUEST_STATUS_LABELS } from "../constants/labels";
import { useAuth } from "../context/AuthContext";
import { useCenter } from "../context/CenterContext";

// The unified queue — v2 §7: INTAKE, ADOPTION, BOARDING and GENERAL all share one
// approval state machine, so one screen decides all four.
//   GET  /requests/centers/{id}/requests?status=&type=
//   POST /requests/{id}/approve · /reject · /cancel · /complete
//
// Two things the backend does NOT do yet, both surfaced in the UI rather than papered
// over: (1) approving or completing an INTAKE does not move the pet — RequestService's
// custody effects are an explicit gap; (2) the role check is role-level only, so any
// CENTER_ADMIN can act on any center's request.
const STATUS_TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

const TYPE_FILTERS = [
  { key: "", label: "All types" },
  { key: "INTAKE", label: "Intake" },
  { key: "ADOPTION", label: "Adoption" },
  { key: "BOARDING", label: "Boarding" },
  { key: "GENERAL", label: "General" },
];

const TYPE_ICONS = {
  INTAKE: Inbox,
  ADOPTION: PawPrint,
  BOARDING: Hotel,
  GENERAL: ClipboardList,
};

export default function RequestQueuePage() {
  const { activeCenterId, activeCenter, hasAnyCenter } = useCenter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState([]);
  const [pets, setPets] = useState({});
  const [status, setStatus] = useState("PENDING");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Filtering server-side keeps this honest for a center with a long history — the
  // endpoint takes status and type, so there's no reason to pull everything and slice.
  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const rows = await requestsApi.listCenterRequests(activeCenterId, { status, type });
      setRequests(rows);
      // Names are a second hop: a request carries only petId.
      getPetsByIds(rows.map((r) => r.petId)).then(setPets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCenterId, status, type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function act(request, action, label) {
    setError("");
    setWorkingId(request.id);
    try {
      const updated = await action();
      setRejectTarget(null);
      setRejectNotes("");
      // The row's status no longer matches the tab being viewed, so refetch rather than
      // patch it in place — otherwise it lingers under a filter it doesn't belong to.
      await refresh();
      toast(`Request ${shortId(updated.id)} ${label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  const isForbidden = error.toLowerCase().includes("forbidden") || error.includes("403");

  const counts = useMemo(() => ({ shown: requests.length }), [requests]);

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Request Queue" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Requests are routed to a center, so you'll need one before there's a queue to review."
          action={
            <Link to="/dashboard/centers/new">
              <Button icon={Building2}>Register a center</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Request Queue"
        subtitle={
          activeCenter
            ? `Every request routed to ${activeCenter.name} — intake, adoption, boarding and general.`
            : "Select a center."
        }
        action={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {/* A 403 here is a configuration fact, not a transient failure, so it gets an
          explanation instead of a bare red banner. */}
      {isForbidden ? (
        <Alert tone="warning" className="mb-5" title="Your account can't act on this queue">
          These endpoints require a platform role of <strong>CENTER_ADMIN</strong>. Core grants authorities
          straight from the JWT&apos;s role claim with no hierarchy, so being a center OWNER — or even a super
          admin — doesn&apos;t satisfy it. Your current role is <strong>{user?.role ?? "unknown"}</strong>. A
          super admin has to grant CENTER_ADMIN in the auth service, and it takes effect on your next login.
        </Alert>
      ) : (
        error && <Alert tone="error" className="mb-5">{error}</Alert>
      )}

      {/* Custody effects aren't implemented server-side; an admin completing a handover
          must not be led to believe the pet moved. */}
      <Alert tone="info" className="mb-5" title="Decisions don't move pets yet">
        Approving and completing update the request record only. The custody transfer — pet status,
        custodian, and the history row — is a documented gap in the request engine, so a completed intake
        won&apos;t yet change the pet.
      </Alert>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Request status" className="glass inline-flex gap-1 rounded-[14px] p-1">
          {STATUS_TABS.map((tab) => {
            const selected = tab.key === status;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                onClick={() => setStatus(tab.key)}
                className={`rounded-[10px] px-3 py-1.5 text-[13px] font-bold transition-all duration-200 ${
                  selected
                    ? "bg-white text-ink-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {tab.label}
                {selected && !loading && (
                  <span className="ml-2 rounded-full bg-brand-500/12 px-1.5 py-0.5 text-[10px] font-extrabold text-brand-600">
                    {counts.shown}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key || "all"}
              onClick={() => setType(filter.key)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition-all duration-200 ${
                type === filter.key
                  ? "bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-[0_4px_12px_rgba(79,70,229,0.24)]"
                  : "bg-white/70 text-ink-500 ring-1 ring-ink-900/5 hover:bg-white hover:text-ink-900"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={`Nothing ${STATUS_TABS.find((t) => t.key === status)?.label.toLowerCase()}`}
          description={
            type
              ? "No requests of this type in this state. Try another type or status."
              : "When somebody raises a request against this center it appears here for review."
          }
        />
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              pet={pets[request.petId]}
              working={workingId === request.id}
              onApprove={() => act(request, () => requestsApi.approve(request.id), "approved")}
              onComplete={() => act(request, () => requestsApi.complete(request.id), "completed")}
              onCancel={() => act(request, () => requestsApi.cancel(request.id), "cancelled")}
              onReject={() => {
                setRejectNotes("");
                setRejectTarget(request);
              }}
            />
          ))}
        </div>
      )}

      {/* Rejection is final for the requester and the remark is the only explanation they
          receive, so it's a deliberate step rather than an inline button. */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this request?"
        description={
          rejectTarget
            ? `Request ${shortId(rejectTarget.id)} will be closed as rejected. The requester sees your remark on their requests page.`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={ThumbsDown}
              loading={workingId === rejectTarget?.id}
              onClick={() =>
                act(rejectTarget, () => requestsApi.reject(rejectTarget.id, rejectNotes), "rejected")
              }
            >
              Reject request
            </Button>
          </>
        }
      >
        <Field
          label="Remark"
          htmlFor="rejectNotes"
          hint="Optional server-side, but without it the requester is told nothing beyond 'rejected'."
        >
          <Textarea
            id="rejectNotes"
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="e.g. We're at capacity until the end of the month — please re-apply after the 30th."
          />
        </Field>
      </Modal>
    </div>
  );
}

function RequestRow({ request, pet, working, onApprove, onReject, onCancel, onComplete }) {
  const Icon = TYPE_ICONS[request.requestType] ?? ClipboardList;
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";

  return (
    <Card className="lift">
      <div className="flex flex-wrap items-start gap-4">
        <IconBubble icon={Icon} accent={isPending ? "peach" : isApproved ? "brand" : "slate"} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-ink-900">
              {pet ? pet.name : `Request ${shortId(request.id)}`}
            </h3>
            <Badge status={request.status} labels={REQUEST_STATUS_LABELS} />
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              {request.requestType}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-500">
            <span>
              Raised by <span className="font-semibold text-ink-700">user #{request.requesterUserId}</span>
            </span>
            <span>{formatWhen(request.createdAt)}</span>
            {pet && (
              <span className="font-mono text-[11.5px] text-ink-400">{shortId(request.petId)}</span>
            )}
            {request.decidedAt && <span>Decided {formatWhen(request.decidedAt)}</span>}
            {request.assignedAdmin && <span>by admin #{request.assignedAdmin}</span>}
          </div>

          {request.notes && (
            <p className="mt-2.5 rounded-[12px] bg-ink-100/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-600">
              {request.notes}
            </p>
          )}
        </div>

        {/* One button per legal transition — PENDING→APPROVED/REJECTED,
            APPROVED→COMPLETED, and cancel from either. Anything else is 409. */}
        <div className="flex flex-wrap items-center gap-2">
          {isPending && (
            <>
              <Button size="sm" variant="success" icon={CheckCircle2} loading={working} onClick={onApprove}>
                Approve
              </Button>
              <Button size="sm" variant="ghost" icon={ThumbsDown} onClick={onReject} className="hover:text-rose-600">
                Reject
              </Button>
            </>
          )}

          {isApproved && (
            <Button size="sm" variant="success" icon={CheckCircle2} loading={working} onClick={onComplete}>
              Complete handover
            </Button>
          )}

          {(isPending || isApproved) && (
            <Button size="sm" variant="ghost" icon={XCircle} onClick={onCancel} className="hover:text-rose-600">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function shortId(id) {
  return id ? `${String(id).slice(0, 8)}…` : "—";
}

function formatWhen(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
