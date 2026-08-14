import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Hotel,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Save,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Alert, Skeleton } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as centersApi from "../api/centers";
import { useCenter } from "../context/CenterContext";

const EMPTY = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  contactEmail: "",
  contactPhone: "",
  latitude: "",
  longitude: "",
  capacity: "",
};

// One form for both POST /centers and PUT /centers/{id} — the backend takes the same
// CareCenterRequest DTO for both, so a single set of fields covers them.
//
// Note what is absent: status and createdBy. Neither is in CareCenterRequest, by design.
// A center can't approve itself, and can't claim a different creator.
export default function CenterFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh, setActiveCenterId } = useCenter();
  const { toast } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;

    (async () => {
      try {
        const center = await centersApi.getCenter(id);
        if (cancelled) return;
        setForm({
          name: center.name ?? "",
          description: center.description ?? "",
          address: center.address ?? "",
          city: center.city ?? "",
          state: center.state ?? "",
          contactEmail: center.contactEmail ?? "",
          contactPhone: center.contactPhone ?? "",
          latitude: center.latitude ?? "",
          longitude: center.longitude ?? "",
          capacity: center.capacity ?? "",
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "edit") {
        await centersApi.updateCenter(id, form);
        await refresh();
        toast("Center details saved.");
        navigate(`/dashboard/centers/${id}`);
      } else {
        const created = await centersApi.createCenter(form);
        // The create also granted an OWNER membership, so refresh the switcher and
        // drop the user straight into the center they just made.
        await refresh();
        setActiveCenterId(created.id);
        toast("Center registered. A super admin will review it shortly.");
        navigate(`/dashboard/centers/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <Skeleton className="h-8 w-52" />
        <Card className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-10 w-full rounded-[12px]" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={mode === "edit" ? "Edit" : "New center"}
        title={mode === "edit" ? "Edit center" : "Register a care center"}
        subtitle={
          mode === "edit"
            ? "Changes go live immediately. Status can only be changed by a platform super admin."
            : "New centers start as pending and need super-admin approval before they go live."
        }
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection
          icon={Building2}
          accent="brand"
          title="About the center"
          description="This is what pet owners see in the public directory."
        >
          <Field label="Center name" required className="sm:col-span-2" htmlFor="name">
            <Input
              id="name"
              required
              maxLength={150}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Happy Paws Shelter"
            />
          </Field>

          <Field
            label="Description"
            required
            className="sm:col-span-2"
            htmlFor="description"
            hint={`${form.description.length}/255 characters`}
          >
            <Textarea
              id="description"
              required
              maxLength={255}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What your center does, who you help, and what makes it a good home."
            />
          </Field>
        </FormSection>

        <FormSection
          icon={MapPin}
          accent="mint"
          title="Location"
          description="Where owners bring their pets."
        >
          <Field label="Address" required className="sm:col-span-2" htmlFor="address">
            <Input
              id="address"
              required
              maxLength={255}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="12 MG Road, Indiranagar"
            />
          </Field>

          <Field label="City" required htmlFor="city">
            <Input
              id="city"
              required
              maxLength={150}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Bengaluru"
            />
          </Field>

          <Field label="State" required htmlFor="state">
            <Input
              id="state"
              required
              maxLength={150}
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="Karnataka"
            />
          </Field>

          <Field label="Latitude" hint="Optional — powers nearby search." htmlFor="lat">
            <Input
              id="lat"
              type="number"
              step="0.000001"
              min={-90}
              max={90}
              icon={Navigation}
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="12.971599"
            />
          </Field>

          <Field label="Longitude" hint="Optional." htmlFor="lng">
            <Input
              id="lng"
              type="number"
              step="0.000001"
              min={-180}
              max={180}
              icon={Navigation}
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="77.594566"
            />
          </Field>
        </FormSection>

        <FormSection
          icon={Phone}
          accent="sky"
          title="Contact & capacity"
          description="How people reach you, and how many animals you can house."
        >
          <Field label="Contact phone" required htmlFor="phone">
            <Input
              id="phone"
              required
              maxLength={15}
              icon={Phone}
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              placeholder="9876543210"
            />
          </Field>

          <Field label="Contact email" htmlFor="email">
            <Input
              id="email"
              type="email"
              maxLength={255}
              icon={Mail}
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="hello@center.org"
            />
          </Field>

          <Field
            label="Kennel capacity"
            required
            className="sm:col-span-2"
            htmlFor="capacity"
            hint="Boarding slots. Zero is valid for foster-only centers that place animals with volunteers instead of housing them."
          >
            <Input
              id="capacity"
              type="number"
              required
              min={0}
              icon={Hotel}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="12"
            />
          </Field>
        </FormSection>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" icon={Save} loading={submitting}>
            {mode === "edit" ? "Save changes" : "Register center"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// Grouping the fields into titled sections gives the form a hierarchy — one flat wall
// of eleven inputs is the thing that made the old version feel like a database screen.
function FormSection({ icon, accent, title, description, children }) {
  return (
    <Card className="animate-rise">
      <div className="flex items-start gap-4">
        <IconBubble icon={icon} accent={accent} />
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-ink-900">{title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}
