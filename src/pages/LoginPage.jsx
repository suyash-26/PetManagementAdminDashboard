import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Heart, Lock, Mail, ShieldCheck } from "lucide-react";
import Brand from "../components/Brand";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { Alert } from "../components/ui/Feedback";
import { useAuth } from "../context/AuthContext";

const HIGHLIGHTS = [
  { icon: Building2, title: "Run your center", body: "Profile, capacity and team in one place." },
  { icon: Heart, title: "Mediate every transfer", body: "Intake, adoption and boarding, all reviewed." },
  { icon: ShieldCheck, title: "Accountable custody", body: "An unbroken chain of responsibility per animal." },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname ?? "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] lg:grid-cols-[1.05fr_1fr] glass">
        {/* Brand panel — hidden on small screens where it would just push the form
            below the fold. */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink-900 via-brand-700 to-violet-500 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-mint-400/20 blur-3xl" />

          <div className="relative flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/15 backdrop-blur">
              <ShieldCheck size={18} strokeWidth={2.4} className="text-white" />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              PetMgmt <span className="font-semibold text-white/60">Admin</span>
            </span>
          </div>

          <div className="relative">
            <h2 className="text-[30px] font-extrabold leading-[1.15] tracking-tight text-white">
              The console for
              <br />
              care centers &amp; NGOs.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
              Every pet transfer on the platform passes through an accountable
              institution. This is where that happens.
            </p>

            <div className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-white/12 backdrop-blur">
                    <Icon size={15} strokeWidth={2.3} className="text-white" />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-white">{title}</p>
                    <p className="text-[12.5px] leading-relaxed text-white/60">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-[11px] text-white/40">
            PetCare Management System · v2 center-mediated transfers
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-white/55 p-8 backdrop-blur-xl sm:p-10">
          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="mt-6 lg:mt-0">
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink-900">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Sign in to manage your care center.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="Email" required htmlFor="email">
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password" required htmlFor="password">
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && <Alert tone="error">{error}</Alert>}

            <Button type="submit" size="lg" loading={submitting} className="mt-1 w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* No signup link, unlike the user dashboard: admins aren't self-serve. You
              become one by creating a center (which makes you its owner) or by being
              added to one by an existing owner. */}
          <p className="mt-7 text-center text-xs leading-relaxed text-ink-400">
            Use your PetMgmt account. Don&apos;t have one? Register through the user app
            first, then create a center here.
          </p>
        </div>
      </div>
    </div>
  );
}
