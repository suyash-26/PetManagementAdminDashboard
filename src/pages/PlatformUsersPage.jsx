import { useCallback, useEffect, useState } from "react";
import { Search, ShieldPlus, UserCog, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Modal from "../components/ui/Modal";
import { Input } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as usersApi from "../api/users";
import {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  ROLE_HINTS,
  ROLE_SUPER_ADMIN,
} from "../constants/labels";
import { useAuth } from "../context/AuthContext";

// SUPER_ADMIN only.
//   GET  /auth/users?search=      — AuthController.getAllUsers
//   POST /auth/users/{id}/role    — AuthController.updateRoleOfUser
// Both are @PreAuthorize("hasRole('SUPER_ADMIN')"), and ProtectedRoute already keeps
// anyone else off this route, so a 403 here means the token's role claim is stale.
//
// Promotion to SUPER_ADMIN is the only role change offered. The endpoint accepts any of
// the three roles, but demotion isn't exposed here — which is also why promoting asks for
// confirmation first: from this page it cannot be undone.
export default function PlatformUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);

  const refresh = useCallback(async (term) => {
    setLoading(true);
    setError("");
    try {
      setUsers(await usersApi.listUsers(term));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh("");
  }, [refresh]);

  function handleSearch(e) {
    e.preventDefault();
    refresh(search.trim());
  }

  async function confirmPromotion() {
    const target = pendingPromotion;
    if (!target) return;

    setError("");
    setSavingId(target.id);
    try {
      const updated = await usersApi.updateUserRole(target.id, ROLE_SUPER_ADMIN);
      // Merge rather than replace: the role endpoint answers with UserResponse (which
      // carries addresses) while the list holds UserSummaryResponse, so a straight swap
      // would change the shape of one row.
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setPendingPromotion(null);
      toast(
        `${usersApi.userLabel(updated)} is now a super admin. They must log out and back in for it to take effect.`,
      );
    } catch (err) {
      setError(err.message);
      setPendingPromotion(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Users & Roles"
        subtitle="Every account on the platform. Promoting someone to super admin takes effect on their next login, because the role is carried in their token."
      />

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      <form onSubmit={handleSearch} className="mb-5 flex flex-wrap gap-2.5">
        <div className="min-w-[14rem] flex-1">
          <Input
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              refresh("");
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match that search"
          description="Try a different name or email address."
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="divide-y divide-white/60">
            {users.map((row) => {
              const isSelf = String(row.id) === String(currentUser?.id);
              const isSuperAdmin = row.role === ROLE_SUPER_ADMIN;
              const fullName = usersApi.userLabel(row);

              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-white/45 sm:px-5"
                >
                  <Avatar name={fullName} seed={row.email} size="lg" />

                  <div className="min-w-[10rem] flex-1">
                    <p className="text-[13.5px] font-bold text-ink-900">
                      {fullName}
                      {isSelf && (
                        <span className="ml-2 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
                          you
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[12px] text-ink-400">{row.email}</p>
                    <div className="mt-1.5 sm:hidden">
                      <Badge status={row.role} labels={PLATFORM_ROLE_LABELS} />
                    </div>
                  </div>

                  <div className="hidden w-36 sm:block">
                    <Badge status={row.role} labels={PLATFORM_ROLE_LABELS} />
                  </div>

                  {/* Fixed width whether or not a button renders, so the badge column
                      above doesn't shift between rows. */}
                  <div className="flex w-full justify-end sm:w-[11.5rem]">
                    {isSuperAdmin ? (
                      <span className="text-[12px] text-ink-400">
                        {isSelf ? "That's you" : "Already a super admin"}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        icon={ShieldPlus}
                        loading={savingId === row.id}
                        onClick={() => setPendingPromotion(row)}
                        title={`Make ${fullName} a super admin`}
                      >
                        Make super admin
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-ink-100 text-ink-500">
            <UserCog size={20} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight text-ink-900">
              What each role means
            </h2>
            <dl className="mt-4 space-y-3">
              {PLATFORM_ROLES.map((role) => (
                <div key={role} className="flex flex-wrap items-baseline gap-2.5">
                  <dt className="w-32 shrink-0">
                    <Badge status={role} labels={PLATFORM_ROLE_LABELS} />
                  </dt>
                  <dd className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-500">
                    {ROLE_HINTS[role]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Card>

      {/* Confirmed rather than one-click: this page grants the highest privilege on the
          platform and offers no way back, so a misclick would need a database fix. */}
      <Modal
        open={Boolean(pendingPromotion)}
        onClose={() => setPendingPromotion(null)}
        title="Make this user a super admin?"
        description={
          pendingPromotion
            ? `${usersApi.userLabel(pendingPromotion)} (${pendingPromotion.email}) will be able to approve, suspend, and reinstate care centers, and promote other users. This page can't undo it. The change applies the next time they log in.`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingPromotion(null)}>
              Cancel
            </Button>
            <Button
              icon={ShieldPlus}
              loading={savingId === pendingPromotion?.id}
              onClick={confirmPromotion}
            >
              Make super admin
            </Button>
          </>
        }
      />
    </div>
  );
}
