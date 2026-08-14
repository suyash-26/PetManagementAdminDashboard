import { Link } from "react-router-dom";
import { ArrowRight, Building2, Check, Hotel, MapPin, Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { EmptyState, SkeletonCard } from "../components/ui/Feedback";
import { CENTER_STATUS_LABELS, MEMBER_ROLE_LABELS } from "../constants/labels";
import { useCenter } from "../context/CenterContext";

// GET /centers/mine — every center this user administers, one card per membership.
export default function CentersPage() {
  const { memberships, centers, loading, activeCenterId, setActiveCenterId } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="My Centers"
        subtitle="Care centers you administer. One person can serve several — switch between them from the header."
        action={
          <Link to="/dashboard/centers/new">
            <Button icon={Plus}>Register a center</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : memberships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No centers yet"
          description="Register a care center to start accepting intake, adoption and boarding requests. You'll become its owner immediately."
          action={
            <Link to="/dashboard/centers/new">
              <Button icon={Plus}>Register a center</Button>
            </Link>
          }
        />
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => {
            const center = centers[membership.centerId];
            const isActive = membership.centerId === activeCenterId;

            return (
              <Card
                key={membership.id}
                className={`lift flex flex-col ${
                  isActive ? "ring-2 ring-brand-500/25" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <IconBubble icon={Building2} accent={isActive ? "brand" : "slate"} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-bold tracking-tight text-ink-900">
                        {center?.name ?? "Loading…"}
                      </h3>
                      {center && (
                        <Badge status={center.status} labels={CENTER_STATUS_LABELS} />
                      )}
                    </div>

                    {center && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-500">
                        <MapPin size={13} strokeWidth={2.2} className="shrink-0 text-ink-400" />
                        <span className="truncate">
                          {center.city}, {center.state}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge status={membership.memberRole} labels={MEMBER_ROLE_LABELS} />
                  {center && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100/70 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                      <Hotel size={12} strokeWidth={2.3} />
                      {center.capacity} slots
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/60 pt-4">
                  <Link to={`/dashboard/centers/${membership.centerId}`}>
                    <Button variant="secondary" size="sm" iconRight={ArrowRight}>
                      View center
                    </Button>
                  </Link>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mint-600">
                      <Check size={14} strokeWidth={2.6} />
                      Acting as this center
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveCenterId(membership.centerId)}
                    >
                      Switch to this
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
