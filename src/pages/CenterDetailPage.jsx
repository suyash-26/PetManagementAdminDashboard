import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Hotel,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Alert, Skeleton } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as centersApi from "../api/centers";
import { CENTER_STATUS_LABELS } from "../constants/labels";

export default function CenterDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await centersApi.getCenter(id);
        if (!cancelled) setCenter(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // The super admin needs this UUID to approve the center, and there's no pending-list
  // endpoint yet — so making it one click to copy is a real workflow shortcut, not chrome.
  async function copyId() {
    try {
      await navigator.clipboard.writeText(center.id);
      setCopied(true);
      toast("Center ID copied — send it to a super admin for approval.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy to clipboard.", "error");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <Skeleton className="h-9 w-64" />
        <Card className="mt-6">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!center) return null;

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Center"
        title={center.name}
        subtitle={`${center.address}, ${center.city}, ${center.state}`}
        action={
          <Link to={`/dashboard/centers/${center.id}/edit`}>
            <Button variant="secondary" icon={Pencil}>
              Edit
            </Button>
          </Link>
        }
      />

      <Card className="animate-rise relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-brand-500/12 to-violet-500/8 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <IconBubble icon={Building2} accent="brand" size="lg" />
            <div>
              <Badge status={center.status} labels={CENTER_STATUS_LABELS} />
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-ink-600">
                {center.description}
              </p>
            </div>
          </div>
        </div>

        {center.status === "PENDING" && (
          <Alert tone="warning" className="relative mt-5" title="Awaiting approval">
            A platform super admin needs to approve this center before it appears
            publicly or can accept requests. Share the center ID below with them.
          </Alert>
        )}

        <dl className="relative mt-7 grid gap-5 border-t border-white/60 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <Detail icon={Hotel} label="Kennel capacity" value={`${center.capacity} slots`} />
          <Detail icon={Phone} label="Contact phone" value={center.contactPhone} />
          <Detail icon={Mail} label="Contact email" value={center.contactEmail || "Not set"} />
          <Detail
            icon={MapPin}
            label="City & state"
            value={`${center.city}, ${center.state}`}
          />
          <Detail
            icon={Navigation}
            label="Coordinates"
            value={
              center.latitude != null && center.longitude != null
                ? `${center.latitude}, ${center.longitude}`
                : "Not set"
            }
          />
          <Detail
            icon={CalendarDays}
            label="Registered"
            value={
              center.createdAt
                ? new Date(center.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
          />
        </dl>

        <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-white/60 pt-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
              Center ID
            </p>
            <p className="mt-1 truncate font-mono text-[12px] text-ink-500">{center.id}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={copied ? Check : Copy}
            onClick={copyId}
          >
            {copied ? "Copied" : "Copy ID"}
          </Button>
        </div>
      </Card>

      <Link to="/dashboard/members" className="group mt-4 block">
        <Card className="lift flex items-center gap-4">
          <IconBubble icon={Users} accent="violet" />
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-ink-900">Manage the team</p>
            <p className="mt-0.5 text-[13px] text-ink-500">
              Add owners and staff, or remove people who&apos;ve left.
            </p>
          </div>
          <ArrowRight
            size={17}
            strokeWidth={2.4}
            className="shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-500"
          />
        </Card>
      </Link>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-ink-300" />
      <div className="min-w-0">
        <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-[13.5px] font-semibold text-ink-800">
          {value}
        </dd>
      </div>
    </div>
  );
}
