import { useCallback, useEffect, useState } from "react";
import { Save, Search, UserCog, Users } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import { Input, Select } from "../components/ui/Field";
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

// SUPER_ADMIN only. Runs entirely on the mock in src/api/users.js — AuthService has no
// user-listing or role-change endpoint yet. Swapping in the real API is a two-line
// change there; this page needs no edits.
export default function PlatformUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({}); // userId -> role chosen but not yet saved

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

  async function handleSave(target) {
    const nextRole = drafts[target.id];
    if (!nextRole || nextRole === target.role) return;

    // Demoting the last super admin leaves nobody able to approve centers — and nobody
    // able to undo it, since this page is itself super-admin-only. The real endpoint
    // must enforce this server-side; blocking it here just prevents the obvious mistake.
    if (
      target.role === ROLE_SUPER_ADMIN &&
      nextRole !== ROLE_SUPER_ADMIN &&
      usersApi.countSuperAdmins() <= 1
    ) {
      setError("This is the last super admin. Promote someone else before demoting them.");
      return;
    }

    setError("");
    setSavingId(target.id);
    try {
      const updated = await usersApi.updateUserRole(target.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      toast(
        `${updated.firstName} ${updated.lastName} is now ${PLATFORM_ROLE_LABELS[updated.role].label}. They must log out and back in for it to take effect.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Users & Roles"
        subtitle="Platform-wide role management. A role change takes effect on the user's next login, because the role is carried in their token."
      />

      {/* Unmissable on purpose — nothing here persists, and a reviewer clicking through
          shouldn't mistake it for a working feature. */}
      <Alert tone="warning" className="mb-5" title="Mock data">
        AuthService has no user-listing or role-change endpoint yet, so this page runs on
        an in-memory list. Changes are lost on refresh.
      </Alert>

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
              const draft = drafts[row.id] ?? row.role;
              const changed = draft !== row.role;

              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-white/45 sm:px-5"
                >
                  <Avatar
                    name={`${row.firstName} ${row.lastName}`}
                    seed={row.email}
                    size="lg"
                  />

                  <div className="min-w-[10rem] flex-1">
                    <p className="text-[13.5px] font-bold text-ink-900">
                      {row.firstName} {row.lastName}
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

                  <div className="flex items-center gap-2">
                    <div className="w-40">
                      <Select
                        value={draft}
                        disabled={isSelf}
                        aria-label={`Role for ${row.firstName} ${row.lastName}`}
                        title={isSelf ? "You can't change your own role" : ROLE_HINTS[draft]}
                        onChange={(e) =>
                          setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                      >
                        {PLATFORM_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {PLATFORM_ROLE_LABELS[role].label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      icon={Save}
                      disabled={!changed || isSelf}
                      loading={savingId === row.id}
                      onClick={() => handleSave(row)}
                    >
                      Save
                    </Button>
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
    </div>
  );
}
