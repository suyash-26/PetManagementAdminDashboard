import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Inbox,
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
import * as intakeApi from "../api/intake";
import * as requestsApi from "../api/requests";
import { getPetsByIds } from "../api/pets";
import { INTAKE_REASON_LABELS, CUSTODY_MODE_LABELS, REQUEST_STATUS_LABELS } from "../constants/labels";
import { useAuth } from "../context/AuthContext";
import { useCenter } from "../context/CenterContext";

// v2 Flow B, the center's side of it.
//   GET  /intake/centers/{id}/intake-requests?status=
//   POST /requests/{id}/approve · /reject · /cancel · /complete   (shared engine)
//
// This exists alongside the generic Request Queue because IntakeRequestResponse is the
// only shape carrying the fields an admin actually needs to decide: reason, custody mode,
// desired handover date, the owner's notes and vet records. RequestResponse has none of
// them, so reviewing intake from the generic queue means deciding blind.
const STATUS_TABS = [
  { key: "PENDING", label: "To review" },
  { key: "APPROVED", label: "Awaiting handover" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function IntakePage() {
  const { activeCenterId, activeCenter, hasAnyCenter } = useCenter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState([]);
  const [pets, setPets] = useState({});
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await intakeApi.listIntakeRequests(activeCenterId, status);
      setRows(data);
      getPetsByIds(data.map((r) => r.petId)).then(setPets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCenterId, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Decisions go through the shared approval engine, keyed by requestId — there are no
  // intake-specific approve/reject endpoints.
  async function act(row, action, label) {
    setError("");
    setWorkingId(row.requestId);
    try {
      await action();
      setRejectTarget(null);
      setRejectNotes("");
      await refresh();
      toast(`Intake request ${shortId(row.requestId)} ${label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  const isForbidden = error.toLowerCase().includes("forbidden") || error.includes("403");

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Intake" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Intake requests are raised against a center, so you'll need one before there's anything to review."
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
        title="Intake"
        subtitle={
          activeCenter
            ? `Pets being handed to ${activeCenter.name} for rehoming, surrender, or emergency.`
            : "Select a center."
        }
        action={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {isForbidden ? (
        <Alert tone="warning" className="mb-5" title="Your account can't review intake">
          This queue requires a platform role of <strong>CENTER_ADMIN</strong> — Core reads authorities
          straight from the JWT role claim with no hierarchy, so a center OWNER or a super admin does not
          qualify. Your role is <strong>{user?.role ?? "unknown"}</strong>. It has to be granted in the auth
          service and takes effect on your next login.
        </Alert>
      ) : (
        error && <Alert tone="error" className="mb-5">{error}</Alert>
      )}

      <Alert tone="info" className="mb-5" title="Completing doesn't transfer custody yet">
        Per Flow B, completing an intake should move the pet to the center in one transaction — status,
        custodian, ownership and a custody-history row. That transfer is a documented gap in the request
        engine, so for now completing only closes the request.
      </Alert>

      <div className="mb-5">
        <div role="tablist" aria-label="Intake status" className="glass inline-flex gap-1 rounded-[14px] p-1">
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
                    {rows.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`Nothing ${STATUS_TABS.find((t) => t.key === status)?.label.toLowerCase()}`}
          description="When an owner offers a pet to this center, their request lands here with the reason, custody mode and handover date."
        />
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {rows.map((row) => (
            <IntakeRow
              key={row.requestId}
              row={row}
              pet={pets[row.petId]}
              working={workingId === row.requestId}
              onApprove={() => act(row, () => requestsApi.approve(row.requestId), "approved")}
              onComplete={() => act(row, () => requestsApi.complete(row.requestId), "completed")}
              onCancel={() => act(row, () => requestsApi.cancel(row.requestId), "cancelled")}
              onReject={() => {
                setRejectNotes("");
                setRejectTarget(row);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this intake request?"
        description={
          rejectTarget
            ? `The owner keeps the pet and sees your remark on their requests page. Flow B calls for a remark on every rejection.`
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
              loading={workingId === rejectTarget?.requestId}
              onClick={() =>
                act(rejectTarget, () => requestsApi.reject(rejectTarget.requestId, rejectNotes), "rejected")
              }
            >
              Reject request
            </Button>
          </>
        }
      >
        <Field label="Remark" htmlFor="intakeRejectNotes" hint="Explain the decision — capacity, policy, missing records.">
          <Textarea
            id="intakeRejectNotes"
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="e.g. We have no kennel space this month. Please re-apply in December."
          />
        </Field>
      </Modal>
    </div>
  );
}

function IntakeRow({ row, pet, working, onApprove, onReject, onCancel, onComplete }) {
  const isPending = row.status === "PENDING";
  const isApproved = row.status === "APPROVED";
  // Foster-in-place consumes no kennel slot (§6.3), which is the single most useful fact
  // when weighing an intake against capacity — so it gets its own emphasis.
  const fosterInPlace = row.custodyMode === "FOSTER_IN_PLACE";

  return (
    <Card className="lift">
      <div className="flex flex-wrap items-start gap-4">
        <IconBubble icon={Inbox} accent={isPending ? "peach" : isApproved ? "brand" : "slate"} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-ink-900">
              {pet ? pet.name : `Pet ${shortId(row.petId)}`}
            </h3>
            <Badge status={row.status} labels={REQUEST_STATUS_LABELS} />
            <Badge status={row.reason} labels={INTAKE_REASON_LABELS} />
            <Badge status={row.custodyMode} labels={CUSTODY_MODE_LABELS} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-500">
            {pet && (
              <span>
                {[pet.breed, pet.species].filter(Boolean).join(" · ")}
                {pet.status ? ` · currently ${pet.status.replaceAll("_", " ").toLowerCase()}` : ""}
              </span>
            )}
            <span>
              From <span className="font-semibold text-ink-700">user #{row.requesterUserId}</span>
            </span>
            <span>Raised {formatWhen(row.createdAt)}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600">
              <CalendarClock size={12} strokeWidth={2.3} />
              {row.handoverDate ? `Handover ${formatDate(row.handoverDate)}` : "No date proposed"}
            </span>
            {fosterInPlace && (
              <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11.5px] font-semibold text-mint-600">
                Uses no kennel slot
              </span>
            )}
            {row.vetRecordsUrl && (
              <a
                href={row.vetRecordsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] font-semibold text-brand-600 ring-1 ring-ink-900/5 transition hover:bg-white"
              >
                <ExternalLink size={12} strokeWidth={2.3} />
                Vet records
              </a>
            )}
          </div>

          {row.ownerNotes && (
            <p className="mt-2.5 rounded-[12px] bg-ink-100/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-600">
              “{row.ownerNotes}”
            </p>
          )}
        </div>

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

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatWhen(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
