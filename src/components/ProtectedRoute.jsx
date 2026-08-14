import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import Card, { IconBubble } from "./ui/Card";
import { useAuth } from "../context/AuthContext";

// `requireSuperAdmin` is the only role gate in the app, and it mirrors the backend's
// @PreAuthorize("hasRole('SUPER_ADMIN')") on PATCH /centers/{id}/status.
//
// There is intentionally no CENTER_ADMIN gate: being a center admin is a center_members
// row, not a JWT role (v2 §3), and a plain USER who creates a center becomes its OWNER
// immediately. Gating on the role claim would lock those people out of the very
// dashboard they need. Per-center authorization is the backend's CenterGuard, which
// returns 403 — this is a navigation convenience, never the security boundary.
export default function ProtectedRoute({ requireSuperAdmin = false }) {
  const { user, initializing, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 size={22} className="animate-spin text-brand-500" />
        <p className="text-sm font-medium text-ink-400">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <Card className="animate-rise mx-auto max-w-lg text-center">
        <div className="flex flex-col items-center">
          <IconBubble icon={ShieldAlert} accent="blush" size="lg" />
          <h2 className="mt-4 text-lg font-bold tracking-tight text-ink-900">
            Super admins only
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            This page approves and suspends care centers across the whole platform. Your
            account doesn&apos;t have that permission.
          </p>
        </div>
      </Card>
    );
  }

  return <Outlet />;
}
