import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Heart,
  IndianRupee,
  PawPrint,
  ThumbsDown,
  Users,
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
import * as adoptionApi from "../api/adoption";
import * as requestsApi from "../api/requests";
import { REQUEST_STATUS_LABELS } from "../constants/labels";
import { useCenter } from "../context/CenterContext";

// v2 Flow C + D, the center's side.
//   GET   /centers/{id}/listings?status=
//   PATCH /listings/{id}                        (delist)
//   GET   /listings/{id}/applicants
//   POST  /requests/{id}/approve · /reject · /complete · /cancel   (shared engine)
//
// New listings are created from the Custody Roster, not here: a listing is only legal for
// a pet already IN_CENTER_CUSTODY at this center, and the roster is the only screen that
// knows which pets those are.
const LISTING_STATUS_LABELS = {
  OPEN: { label: "Open", color: "bg-emerald-100 text-emerald-700" },
  RESERVED: { label: "Reserved", color: "bg-sky-100 text-sky-700" },
  CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-600" },
};

const STATUS_TABS = [
  { key: "OPEN", label: "Open" },
  { key: "RESERVED", label: "Reserved" },
  { key: "CLOSED", label: "Closed" },
];

export default function ListingsPage() {
  const { activeCenterId, activeCenter, hasAnyCenter } = useCenter();
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [delistTarget, setDelistTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setListings(await adoptionApi.listCenterListings(activeCenterId, status));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCenterId, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function confirmDelist() {
    setWorking(true);
    setError("");
    try {
      await adoptionApi.delist(delistTarget.id);
      setDelistTarget(null);
      await refresh();
      toast(`${delistTarget.petName} is no longer listed.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Adoption Listings" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Only a center can list a pet for adoption, so you'll need one before there's anything here."
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
        title="Adoption Listings"
        subtitle={
          activeCenter
            ? `Pets ${activeCenter.name} has listed, and the people applying for them.`
            : "Select a center."
        }
        action={
          <Link to="/dashboard/custody">
            <Button icon={Heart}>List a pet</Button>
          </Link>
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <Alert tone="info" className="mb-5" title="Approving is a promise, not a handover">
        Approving an applicant reserves the listing and the pet — nothing transfers. Ownership moves
        only when you complete the request after the physical handover, which also auto-rejects every
        rival application.
      </Alert>

      <div className="mb-5">
        <div role="tablist" aria-label="Listing status" className="glass inline-flex gap-1 rounded-[14px] p-1">
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
                    {listings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={`No ${status.toLowerCase()} listings`}
          description={
            status === "OPEN"
              ? "Take a pet in through intake, complete the handover, then list it from the custody roster."
              : "Nothing in this state yet."
          }
          action={
            status === "OPEN" ? (
              <Link to="/dashboard/custody">
                <Button icon={Heart}>Go to custody roster</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {listings.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onDelist={() => setDelistTarget(listing)}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(delistTarget)}
        onClose={() => setDelistTarget(null)}
        title="Take this listing down?"
        description={
          delistTarget
            ? `${delistTarget.petName} comes off the public feed and returns to your custody roster. You keep custody either way — this does not return the pet to its previous owner.`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDelistTarget(null)}>
              Keep listed
            </Button>
            <Button variant="danger" icon={XCircle} loading={working} onClick={confirmDelist}>
              Delist
            </Button>
          </>
        }
      />
    </div>
  );
}

function ListingRow({ listing, onDelist, onChanged }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [applicants, setApplicants] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Applicants are fetched only when a row is opened — a center with fifty listings
  // shouldn't fire fifty requests on page load.
  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setApplicants(await adoptionApi.listApplicants(listing.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listing.id]);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && applicants === null) loadApplicants();
  }

  async function act(applicant, action, label) {
    setError("");
    setWorkingId(applicant.requestId);
    try {
      await action();
      setRejectTarget(null);
      setRejectNotes("");
      await loadApplicants();
      // Approving or completing changes the listing's own status too, so the outer list
      // has to be refetched — otherwise the OPEN tab keeps showing a now-RESERVED listing.
      await onChanged();
      toast(`Application from user #${applicant.adopterUserId} ${label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  const pendingCount = applicants?.filter((a) => a.status === "PENDING").length ?? null;

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <IconBubble
          icon={Heart}
          accent={
            listing.listingStatus === "OPEN"
              ? "mint"
              : listing.listingStatus === "RESERVED"
                ? "sky"
                : "slate"
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-ink-900">{listing.petName}</h3>
            <Badge status={listing.listingStatus} labels={LISTING_STATUS_LABELS} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-500">
            <span>{[listing.breed, listing.species].filter(Boolean).join(" · ")}</span>
            {listing.dateOfBirth && <span>Born {formatDate(listing.dateOfBirth)}</span>}
            <span>Listed {formatWhen(listing.postedAt)}</span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-100/70 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600">
              <IndianRupee size={11} strokeWidth={2.4} />
              {listing.adoptionFee != null ? Number(listing.adoptionFee).toLocaleString() : "No fee"}
            </span>
            {listing.vaccinated && (
              <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11.5px] font-semibold text-mint-600">
                Vaccinated
              </span>
            )}
          </div>

          {listing.description && (
            <p className="mt-2.5 rounded-[12px] bg-ink-100/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-600">
              {listing.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={expanded ? ChevronDown : ChevronRight}
            onClick={toggle}
          >
            {pendingCount != null ? `${pendingCount} to screen` : "Applicants"}
          </Button>
          {listing.listingStatus === "OPEN" && (
            <Button size="sm" variant="ghost" icon={XCircle} onClick={onDelist} className="hover:text-rose-600">
              Delist
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-5 border-t border-white/70 pt-5">
          {error && <Alert tone="error" className="mb-4">{error}</Alert>}

          {loading ? (
            <SkeletonRows rows={2} />
          ) : !applicants || applicants.length === 0 ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-ink-100/50 px-4 py-3.5 text-[13px] text-ink-500">
              <Users size={16} strokeWidth={2.1} className="shrink-0 text-ink-400" />
              No applications yet. The listing is on the public feed — adopters apply from there.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.requestId}
                  applicant={applicant}
                  listingStatus={listing.listingStatus}
                  working={workingId === applicant.requestId}
                  onApprove={() =>
                    act(applicant, () => requestsApi.approve(applicant.requestId), "approved")
                  }
                  onComplete={() =>
                    act(applicant, () => requestsApi.complete(applicant.requestId), "completed")
                  }
                  onCancel={() =>
                    act(applicant, () => requestsApi.cancel(applicant.requestId), "cancelled")
                  }
                  onReject={() => {
                    setRejectNotes("");
                    setRejectTarget(applicant);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this application?"
        description="The applicant sees your remark on their requests page. Other applications are unaffected."
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
              Reject application
            </Button>
          </>
        }
      >
        <Field label="Remark" htmlFor="applicantRejectNotes" hint="Why this applicant wasn't right for this pet.">
          <Textarea
            id="applicantRejectNotes"
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="e.g. Home visit showed no secure outdoor space for a dog this size."
          />
        </Field>
      </Modal>
    </Card>
  );
}

function ApplicantRow({ applicant, listingStatus, working, onApprove, onReject, onCancel, onComplete }) {
  const isPending = applicant.status === "PENDING";
  const isApproved = applicant.status === "APPROVED";
  // Once someone else is approved the listing is RESERVED, so approving a second applicant
  // would 409 ALREADY_RESERVED. Hide the button rather than offer a guaranteed failure.
  const canApprove = isPending && listingStatus === "OPEN";

  return (
    <div className="rounded-[16px] border border-white/70 bg-white/55 p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold text-ink-900">
              User #{applicant.adopterUserId}
            </span>
            <Badge status={applicant.status} labels={REQUEST_STATUS_LABELS} />
            {applicant.homeVisitStatus && (
              <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11px] font-semibold text-mint-600">
                Home visit done
              </span>
            )}
          </div>

          <p className="mt-1.5 text-[12px] text-ink-400">Applied {formatWhen(applicant.createdAt)}</p>

          {applicant.message && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">“{applicant.message}”</p>
          )}

          {applicant.screeningAnswers && (
            <div className="mt-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                Screening answers
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-[10px] bg-ink-100/60 px-3 py-2 text-[12px] leading-relaxed text-ink-600">
                {applicant.screeningAnswers}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <Button size="sm" variant="success" icon={CheckCircle2} loading={working} onClick={onApprove}>
              Approve
            </Button>
          )}
          {isPending && (
            <Button size="sm" variant="ghost" icon={ThumbsDown} onClick={onReject} className="hover:text-rose-600">
              Reject
            </Button>
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
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
