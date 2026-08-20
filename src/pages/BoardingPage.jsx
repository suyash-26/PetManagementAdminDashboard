import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarRange,
  CheckCircle2,
  Hotel,
  LogIn,
  LogOut,
  ThumbsDown,
  XCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as boardingApi from "../api/boarding";
import * as requestsApi from "../api/requests";
import { getPetsByIds } from "../api/pets";
import { REQUEST_STATUS_LABELS } from "../constants/labels";
import { useCenter } from "../context/CenterContext";

// v2 Flow E, the center's side.
//   GET  /centers/{id}/boarding-requests?status=
//   GET  /centers/{id}/availability?from=&to=
//   POST /boarding-requests/{id}/check-in · /check-out
//   POST /requests/{id}/approve · /reject · /cancel        (shared engine)
//
// The invariant this page exists to respect: boarding is a custody LOAN. Check-in sets the
// custodian and moves the pet to IN_BOARDING; ownership never changes, so the pet stays in
// its owner's "My Pets" throughout. Check-out clears custody and completes the request.
const STATUS_TABS = [
  { key: "PENDING", label: "To review" },
  { key: "APPROVED", label: "Booked & staying" },
  { key: "COMPLETED", label: "Finished" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function BoardingPage() {
  const { activeCenterId, activeCenter, hasAnyCenter } = useCenter();
  const { toast } = useToast();

  const [rows, setRows] = useState([]);
  const [pets, setPets] = useState({});
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Availability is a separate, deliberately manual lookup: the server reports occupancy
  // but does not enforce it (no NO_CAPACITY yet), so this is a decision aid for the admin
  // rather than a gate the API applies.
  const [dateWindow, setDateWindow] = useState(() => defaultWindow());
  const [availability, setAvailability] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await boardingApi.listBoardingRequests(activeCenterId, status);
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

  async function checkAvailability() {
    setCheckingAvailability(true);
    setAvailabilityError("");
    try {
      setAvailability(
        await boardingApi.getAvailability(activeCenterId, dateWindow.from, dateWindow.to),
      );
    } catch (err) {
      setAvailabilityError(err.message);
      setAvailability(null);
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function act(row, action, label) {
    setError("");
    setWorkingId(row.requestId);
    try {
      await action();
      setRejectTarget(null);
      setRejectNotes("");
      await refresh();
      toast(`Boarding request ${shortId(row.requestId)} ${label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Boarding" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Boarding requests are raised against a center, so there's nothing to review until you administer one."
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
        title="Boarding"
        subtitle={
          activeCenter
            ? `Temporary stays at ${activeCenter.name}. Owners keep ownership throughout.`
            : "Select a center."
        }
        action={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-4">
          <IconBubble icon={CalendarRange} accent="violet" />

          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold tracking-tight text-ink-900">Kennel availability</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
              Approved boardings overlapping the window, plus pets physically in custody, against
              this center's capacity.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Field label="From" htmlFor="availFrom" className="w-[150px]">
              <Input
                id="availFrom"
                type="date"
                value={dateWindow.from}
                onChange={(e) => setDateWindow({ ...dateWindow, from: e.target.value })}
              />
            </Field>
            <Field label="To" htmlFor="availTo" className="w-[150px]">
              <Input
                id="availTo"
                type="date"
                value={dateWindow.to}
                onChange={(e) => setDateWindow({ ...dateWindow, to: e.target.value })}
              />
            </Field>
            <Button variant="secondary" loading={checkingAvailability} onClick={checkAvailability}>
              Check
            </Button>
          </div>
        </div>

        {availabilityError && (
          <Alert tone="error" className="mt-4">
            {availabilityError}
          </Alert>
        )}

        {availability && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Capacity" value={availability.capacity} />
              <Stat label="Boardings" value={availability.occupiedByBoardings} />
              <Stat label="In custody" value={availability.occupiedByCustody} />
              <Stat
                label="Free"
                value={availability.available}
                tone={availability.available <= 0 ? "danger" : "good"}
              />
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
              Advisory only — the API does not reject over-capacity bookings yet, and foster-in-place
              intakes are counted even though they occupy no kennel.
            </p>
          </>
        )}
      </Card>

      <div className="mb-5">
        <div role="tablist" aria-label="Boarding status" className="glass inline-flex gap-1 rounded-[14px] p-1">
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
          icon={Hotel}
          title={`Nothing ${STATUS_TABS.find((t) => t.key === status)?.label.toLowerCase()}`}
          description="When an owner books a stay for their pet, it lands here with the dates and any special instructions."
        />
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {rows.map((row) => (
            <BoardingRow
              key={row.requestId}
              row={row}
              pet={pets[row.petId]}
              working={workingId === row.requestId}
              onApprove={() => act(row, () => requestsApi.approve(row.requestId), "approved")}
              onCheckIn={() => act(row, () => boardingApi.checkIn(row.requestId), "checked in")}
              onCheckOut={() => act(row, () => boardingApi.checkOut(row.requestId), "checked out")}
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
        title="Reject this boarding request?"
        description="The owner keeps their pet and sees your remark on their requests page."
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
        <Field label="Remark" htmlFor="boardingRejectNotes" hint="Usually capacity — say when you would have space.">
          <Textarea
            id="boardingRejectNotes"
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="e.g. Fully booked that week. We have space from the 12th."
          />
        </Field>
      </Modal>
    </div>
  );
}

function BoardingRow({ row, pet, working, onApprove, onReject, onCancel, onCheckIn, onCheckOut }) {
  const isPending = row.status === "PENDING";
  const isApproved = row.status === "APPROVED";
  const staying = Boolean(row.checkedInAt) && !row.checkedOutAt;
  const nights = nightsBetween(row.startDate, row.endDate);

  return (
    <Card className="lift">
      <div className="flex flex-wrap items-start gap-4">
        <IconBubble
          icon={Hotel}
          accent={staying ? "violet" : isPending ? "peach" : isApproved ? "brand" : "slate"}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-ink-900">
              {pet ? pet.name : `Pet ${shortId(row.petId)}`}
            </h3>
            <Badge status={row.status} labels={REQUEST_STATUS_LABELS} />
            {staying && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                Currently staying
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-500">
            {pet && <span>{[pet.breed, pet.species].filter(Boolean).join(" · ")}</span>}
            <span>
              From <span className="font-semibold text-ink-700">user #{row.requesterUserId}</span>
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600">
              <CalendarRange size={12} strokeWidth={2.3} />
              {formatDate(row.startDate)} → {formatDate(row.endDate)}
              {nights != null && ` · ${nights} night${nights === 1 ? "" : "s"}`}
            </span>
            {row.quotedPrice != null && (
              <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11.5px] font-semibold text-mint-600">
                Quoted ₹{Number(row.quotedPrice).toLocaleString()}
              </span>
            )}
            {row.checkedInAt && (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600 ring-1 ring-ink-900/5">
                In {formatWhen(row.checkedInAt)}
              </span>
            )}
            {row.checkedOutAt && (
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600 ring-1 ring-ink-900/5">
                Out {formatWhen(row.checkedOutAt)}
              </span>
            )}
          </div>

          {row.specialInstructions && (
            <p className="mt-2.5 rounded-[12px] bg-ink-100/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-600">
              “{row.specialInstructions}”
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

          {/* Check-in only after approval; check-out only after check-in. The server enforces
              both, but offering a button that always 409s is worse than hiding it. */}
          {isApproved && !row.checkedInAt && (
            <Button size="sm" icon={LogIn} loading={working} onClick={onCheckIn}>
              Check in
            </Button>
          )}
          {isApproved && staying && (
            <Button size="sm" variant="success" icon={LogOut} loading={working} onClick={onCheckOut}>
              Check out
            </Button>
          )}

          {(isPending || (isApproved && !row.checkedInAt)) && (
            <Button size="sm" variant="ghost" icon={XCircle} onClick={onCancel} className="hover:text-rose-600">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, tone }) {
  const valueColor =
    tone === "danger" ? "text-rose-600" : tone === "good" ? "text-mint-600" : "text-ink-900";
  return (
    <div className="rounded-[14px] border border-white/70 bg-white/55 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tracking-tight ${valueColor}`}>{value}</p>
    </div>
  );
}

// Defaults to today → a week out, which is the window an admin checks most often.
function defaultWindow() {
  const today = new Date();
  const later = new Date(today);
  later.setDate(later.getDate() + 7);
  return { from: toInputDate(today), to: toInputDate(later) };
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function nightsBetween(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return ms > 0 ? Math.round(ms / 86400000) : null;
}

function shortId(id) {
  return id ? `${String(id).slice(0, 8)}…` : "—";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
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
