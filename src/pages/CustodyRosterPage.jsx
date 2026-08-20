import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Dog, Heart, PawPrint, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as intakeApi from "../api/intake";
import * as adoptionApi from "../api/adoption";
import { PET_STATUS_LABELS } from "../constants/labels";
import { useCenter } from "../context/CenterContext";

// v2 §8's GET /centers/{id}/custody — every pet this center is currently responsible for.
//
// This is the entry point to Flow C. A listing can only be created for a pet whose
// custodianCenterId is this center AND whose status is IN_CENTER_CUSTODY, so the roster is
// the only place where an admin can see which pets are actually listable. Picking a pet id
// by hand elsewhere just earns a 409 PET_NOT_IN_YOUR_CUSTODY.
const FILTERS = [
  { key: "ALL", label: "Everything" },
  { key: "IN_CENTER_CUSTODY", label: "Listable" },
  { key: "AVAILABLE_FOR_ADOPTION", label: "Listed" },
  { key: "RESERVED", label: "Reserved" },
  { key: "IN_BOARDING", label: "Boarding" },
];

export default function CustodyRosterPage() {
  const { activeCenterId, activeCenter, hasAnyCenter } = useCenter();
  const { toast } = useToast();

  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listTarget, setListTarget] = useState(null);
  const [form, setForm] = useState({ description: "", reason: "", adoptionFee: "" });
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setPets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setPets(await intakeApi.listCustodyRoster(activeCenterId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCenterId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo(
    () => (filter === "ALL" ? pets : pets.filter((p) => p.status === filter)),
    [pets, filter],
  );

  // Counted off the unfiltered list so the number doesn't change as you switch tabs.
  const listableCount = useMemo(
    () => pets.filter((p) => p.status === "IN_CENTER_CUSTODY").length,
    [pets],
  );

  async function submitListing(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await adoptionApi.createListing(activeCenterId, { petId: listTarget.id, ...form });
      setListTarget(null);
      setForm({ description: "", reason: "", adoptionFee: "" });
      await refresh();
      toast(`${listTarget.name} is now listed for adoption.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // The endpoint is mapped but still throws NOT_IMPLEMENTED, so this is the expected
  // failure until the backend lands rather than a bug in this page.
  const rosterMissing =
    error.includes("501") || error.toUpperCase().includes("NOT_IMPLEMENTED");

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Operations" title="Custody Roster" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Custody is held by a center, so there's nothing to show until you administer one."
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
        title="Custody Roster"
        subtitle={
          activeCenter
            ? `Every pet ${activeCenter.name} is currently responsible for.`
            : "Select a center."
        }
        action={
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {rosterMissing ? (
        <Alert tone="warning" className="mb-5" title="The custody roster endpoint isn't built yet">
          <code className="font-mono text-[12px]">GET /intake/centers/&#123;id&#125;/custody</code> is
          mapped but still answers 501. Everything else on this page — the filters, and listing a pet
          for adoption — works the moment it returns pets.
        </Alert>
      ) : (
        error && <Alert tone="error" className="mb-5">{error}</Alert>
      )}

      {!loading && !error && pets.length > 0 && (
        <Alert tone="info" className="mb-5">
          {listableCount === 0
            ? "Nothing is listable right now — a pet must be IN_CENTER_CUSTODY, which happens once you complete its intake handover."
            : `${listableCount} pet${listableCount === 1 ? "" : "s"} in custody and ready to list for adoption.`}
        </Alert>
      )}

      <div className="mb-5">
        <div role="tablist" aria-label="Custody filter" className="glass inline-flex gap-1 rounded-[14px] p-1">
          {FILTERS.map((tab) => {
            const selected = tab.key === filter;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(tab.key)}
                className={`rounded-[10px] px-3 py-1.5 text-[13px] font-bold transition-all duration-200 ${
                  selected
                    ? "bg-white text-ink-900 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={filter === "ALL" ? "No pets in custody" : "Nothing in this state"}
          description="Pets arrive here when an intake handover is completed — that's the moment custody actually transfers."
        />
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {rows.map((pet) => (
            <RosterRow
              key={pet.id}
              pet={pet}
              onList={() => {
                setForm({ description: "", reason: "", adoptionFee: "" });
                setListTarget(pet);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(listTarget)}
        onClose={() => setListTarget(null)}
        title={listTarget ? `List ${listTarget.name} for adoption` : ""}
        description="This goes on the public feed straight away. Ownership does not change — you keep custody until an approved adopter collects the pet."
        footer={
          <>
            <Button variant="ghost" onClick={() => setListTarget(null)}>
              Cancel
            </Button>
            <Button icon={Heart} loading={submitting} form="listingForm" type="submit">
              Publish listing
            </Button>
          </>
        }
      >
        <form id="listingForm" onSubmit={submitListing} className="flex flex-col gap-4">
          <Field
            label="Public description"
            htmlFor="listingDescription"
            hint="What an adopter reads on the feed — temperament, energy level, good with kids or other pets."
          >
            <Textarea
              id="listingDescription"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Friendly three-year-old indie, house-trained, great with children."
            />
          </Field>

          <Field
            label="Why they need a home"
            htmlFor="listingReason"
            hint="Optional context. Also public."
          >
            <Textarea
              id="listingReason"
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Surrendered when the family relocated abroad."
            />
          </Field>

          <Field
            label="Adoption fee"
            htmlFor="listingFee"
            hint="Leave blank for no fee. Must be zero or more."
          >
            <Input
              id="listingFee"
              type="number"
              min="0"
              step="0.01"
              value={form.adoptionFee}
              onChange={(e) => setForm({ ...form, adoptionFee: e.target.value })}
              placeholder="500"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

function RosterRow({ pet, onList }) {
  const listable = pet.status === "IN_CENTER_CUSTODY";
  // Boarding guests are the one case where the center holds a pet that someone else still
  // owns — worth calling out, because they must never be listed.
  const isBoarder = pet.status === "IN_BOARDING";

  return (
    <Card className="lift">
      <div className="flex flex-wrap items-start gap-4">
        <IconBubble
          icon={isBoarder ? ShieldCheck : Dog}
          accent={listable ? "mint" : isBoarder ? "violet" : "slate"}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-ink-900">{pet.name}</h3>
            <Badge status={pet.status} labels={PET_STATUS_LABELS} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-500">
            <span>{[pet.breed, pet.species].filter(Boolean).join(" · ")}</span>
            {pet.dateOfBirth && <span>Born {formatDate(pet.dateOfBirth)}</span>}
            {pet.surrenderedByUserId && <span>Handed in by user #{pet.surrenderedByUserId}</span>}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {pet.vaccinated && (
              <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11.5px] font-semibold text-mint-600">
                Vaccinated
              </span>
            )}
            {pet.sterilized && (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11.5px] font-semibold text-sky-700">
                Sterilised
              </span>
            )}
            {isBoarder && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11.5px] font-semibold text-violet-700">
                Still owned by user #{pet.ownerUserId} — cannot be listed
              </span>
            )}
          </div>

          {pet.medicalNotes && (
            <p className="mt-2.5 rounded-[12px] bg-ink-100/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink-600">
              {pet.medicalNotes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {listable && (
            <Button size="sm" icon={Heart} onClick={onList}>
              List for adoption
            </Button>
          )}
          {pet.status === "AVAILABLE_FOR_ADOPTION" && (
            <Link to="/dashboard/listings">
              <Button size="sm" variant="secondary">
                View listing
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
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
