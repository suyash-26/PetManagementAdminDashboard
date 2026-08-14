import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Info,
  Lock,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Button from "../components/ui/Button";
import Card, { IconBubble } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import Modal from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Field";
import { Alert, EmptyState, SkeletonRows } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";
import * as centersApi from "../api/centers";
import * as usersApi from "../api/users";
import { MEMBER_ROLES, MEMBER_ROLE_LABELS } from "../constants/labels";
import { useAuth } from "../context/AuthContext";
import { useCenter } from "../context/CenterContext";

// Team management for the active center.
//   GET    /centers/{id}/members             — any center admin
//   POST   /centers/{id}/members             — OWNER only
//   DELETE /centers/{id}/members/{memberId}  — OWNER only, refused for the last OWNER
//
// Members are stored in Core as a bare userId with no FK into the Auth database, so names
// come from AuthService's GET /auth/users. That route is SUPER_ADMIN-only, and a center
// OWNER need not be one — see loadDirectory() for what happens when it's out of reach.
export default function MembersPage() {
  const { user } = useAuth();
  const { activeCenterId, activeCenter, isOwnerOfActiveCenter, hasAnyCenter } = useCenter();
  const { toast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removing, setRemoving] = useState(false);
  // The account directory, used both to populate the picker and to label member rows.
  // Three states, and the field below renders differently for each: undefined = still
  // loading, null = not available to this admin (fall back to raw ids), array = loaded.
  const [directory, setDirectory] = useState(undefined);

  const refresh = useCallback(async () => {
    if (!activeCenterId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setMembers(await centersApi.listMembers(activeCenterId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCenterId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Only owners can add anyone, so nobody else needs the directory. The request is
  // attempted rather than gated on isSuperAdmin because the role travels in the JWT and
  // can be a login behind the database — a 403 here is an expected outcome, not a page
  // error, so it degrades to the manual-id field instead of showing a red banner.
  const loadDirectory = useCallback(async () => {
    if (!isOwnerOfActiveCenter) {
      setDirectory(null);
      return;
    }
    try {
      setDirectory(await usersApi.listUsers());
    } catch {
      setDirectory(null);
    }
  }, [isOwnerOfActiveCenter]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // Switching centers changes which accounts are still addable, so drop any half-made
  // selection rather than carry it over to a different team.
  useEffect(() => {
    setNewUserId("");
    setNewRole("STAFF");
    setShowForm(false);
  }, [activeCenterId]);

  const usersById = new Map((directory ?? []).map((u) => [String(u.id), u]));
  const memberUserIds = new Set(members.map((m) => String(m.userId)));
  // Core rejects a second membership for the same user with 409 MEMBER_ALREADY_EXISTS, so
  // current members are left out of the picker entirely.
  const addableUsers = (directory ?? []).filter((u) => !memberUserIds.has(String(u.id)));

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await centersApi.addMember(activeCenterId, { userId: newUserId, memberRole: newRole });
      const added = usersById.get(String(newUserId));
      setNewUserId("");
      setNewRole("STAFF");
      setShowForm(false);
      await refresh();
      toast(added ? `${usersApi.userLabel(added)} added to the team.` : "Team member added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    setError("");
    setRemoving(true);
    try {
      await centersApi.removeMember(activeCenterId, pendingRemoval.id);
      setPendingRemoval(null);
      await refresh();
      toast("Member removed from this center.");
    } catch (err) {
      setError(err.message);
      setPendingRemoval(null);
    } finally {
      setRemoving(false);
    }
  }

  if (!hasAnyCenter) {
    return (
      <div>
        <PageHeader eyebrow="Workspace" title="Team" />
        <EmptyState
          icon={Building2}
          title="Register a center first"
          description="Team members belong to a center, so you'll need one before you can add anybody."
          action={
            <Link to="/dashboard/centers/new">
              <Button icon={Building2}>Register a center</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const ownerCount = members.filter((m) => m.memberRole === "OWNER").length;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Team"
        subtitle={
          activeCenter
            ? `Admins of ${activeCenter.name}. One person can serve several centers.`
            : "Select a center."
        }
        action={
          isOwnerOfActiveCenter && (
            <Button
              icon={showForm ? undefined : UserPlus}
              variant={showForm ? "secondary" : "primary"}
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancel" : "Add member"}
            </Button>
          )
        }
      />

      {/* Mirrors CenterGuard.requireCenterOwner — STAFF can see the team but not change
          it. The backend enforces this regardless; hiding the controls just avoids
          offering a button that always 403s. */}
      {!isOwnerOfActiveCenter && (
        <Alert tone="info" className="mb-5">
          You&apos;re staff at this center. Only an owner can add or remove members.
        </Alert>
      )}

      {error && <Alert tone="error" className="mb-5">{error}</Alert>}

      {showForm && isOwnerOfActiveCenter && (
        <Card className="animate-rise mb-5">
          <div className="flex items-start gap-4">
            <IconBubble icon={UserPlus} accent="violet" />
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-ink-900">
                Add a team member
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-400">
                They&apos;ll be able to act on this center immediately.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="mt-5 grid gap-4 sm:grid-cols-3">
            {directory === undefined ? (
              <Field label="User" required className="sm:col-span-2" htmlFor="userId">
                <Select id="userId" disabled value="">
                  <option value="">Loading accounts…</option>
                </Select>
              </Field>
            ) : directory ? (
              <Field
                label="User"
                required
                className="sm:col-span-2"
                htmlFor="userId"
                hint={
                  addableUsers.length === 0
                    ? "Every account is already on this team."
                    : "Accounts already on this team aren't listed."
                }
              >
                {/* The option value is the account's numeric auth id — that is what Core
                    stores in center_members.user_id, and what addMember() sends. */}
                <Select
                  id="userId"
                  required
                  value={newUserId}
                  disabled={addableUsers.length === 0}
                  onChange={(e) => setNewUserId(e.target.value)}
                >
                  <option value="">Select a user…</option>
                  {addableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {usersApi.userLabel(u)} — {u.email}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                label="User ID"
                required
                className="sm:col-span-2"
                htmlFor="userId"
                // Reached when /auth/users is out of reach (it is SUPER_ADMIN-only) — Core
                // stores user_id as a plain reference with no FK to the Auth database, so
                // nothing here can resolve or validate the id before you submit.
                hint="Their numeric account ID from the auth service. Double-check it — the account list is only available to super admins, so a wrong ID adds the wrong person."
              >
                <Input
                  id="userId"
                  type="number"
                  required
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. 42"
                />
              </Field>
            )}

            <Field label="Role" htmlFor="role">
              <Select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {MEMBER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {MEMBER_ROLE_LABELS[role].label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="sm:col-span-3">
              <Button type="submit" icon={UserPlus} loading={submitting} disabled={!newUserId}>
                Add to center
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonRows rows={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add owners and staff so more than one person can run this center."
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          {/* Cards on mobile, a table on desktop — a horizontally scrolling table on a
              phone is the single worst pattern in admin UIs. */}
          <div className="divide-y divide-white/60 md:hidden">
            {members.map((member) => (
              <MemberRowMobile
                key={member.id}
                member={member}
                account={usersById.get(String(member.userId))}
                isSelf={String(member.userId) === String(user?.id)}
                isLastOwner={member.memberRole === "OWNER" && ownerCount === 1}
                canManage={isOwnerOfActiveCenter}
                onRemove={() => setPendingRemoval(member)}
              />
            ))}
          </div>

          <table className="hidden min-w-full text-sm md:table">
            <thead>
              <tr className="border-b border-white/60">
                {["Member", "Role", "Joined", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {members.map((member) => {
                const isSelf = String(member.userId) === String(user?.id);
                const isLastOwner = member.memberRole === "OWNER" && ownerCount === 1;
                const account = usersById.get(String(member.userId));

                return (
                  <tr key={member.id} className="transition-colors hover:bg-white/45">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={account ? usersApi.userLabel(account) : `U ${member.userId}`}
                          seed={String(member.userId)}
                        />
                        <div>
                          <p className="text-[13.5px] font-bold text-ink-900">
                            {account ? usersApi.userLabel(account) : `User #${member.userId}`}
                            {isSelf && (
                              <span className="ml-2 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
                                you
                              </span>
                            )}
                          </p>
                          {/* Falls back to the membership id when the account isn't
                              resolvable, so the row still carries something identifying. */}
                          <p className="truncate text-[11px] text-ink-400">
                            {account?.email ?? (
                              <span className="font-mono">{member.id.slice(0, 8)}…</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={member.memberRole} labels={MEMBER_ROLE_LABELS} />
                    </td>
                    <td className="px-5 py-4 text-[13px] text-ink-500">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isOwnerOfActiveCenter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={isLastOwner ? Lock : Trash2}
                          disabled={isLastOwner}
                          title={
                            isLastOwner
                              ? "A center must keep at least one owner"
                              : "Remove from center"
                          }
                          onClick={() => setPendingRemoval(member)}
                          className={isLastOwner ? "" : "hover:text-rose-600"}
                        >
                          {isLastOwner ? "Protected" : "Remove"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {members.length > 0 && (
        <div className="mt-4 flex items-start gap-2.5 px-1 text-[12.5px] leading-relaxed text-ink-400">
          <Info size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" />
          <p>
            <strong className="font-semibold text-ink-500">Owners</strong> can add and
            remove members.{" "}
            <strong className="font-semibold text-ink-500">Staff</strong> handle
            day-to-day work — approving requests, logging care, managing boarding.
          </p>
        </div>
      )}

      {/* Removal is irreversible and instant, so it gets a confirmation step. */}
      <Modal
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        title="Remove this member?"
        description={
          pendingRemoval
            ? `${
                usersById.has(String(pendingRemoval.userId))
                  ? usersApi.userLabel(usersById.get(String(pendingRemoval.userId)))
                  : `User #${pendingRemoval.userId}`
              } will immediately lose access to ${activeCenter?.name ?? "this center"}. You can add them back later.`
            : ""
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} loading={removing} onClick={confirmRemove}>
              Remove member
            </Button>
          </>
        }
      />
    </div>
  );
}

function MemberRowMobile({ member, account, isSelf, isLastOwner, canManage, onRemove }) {
  const name = account ? usersApi.userLabel(account) : `User #${member.userId}`;

  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar name={name} seed={String(member.userId)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-ink-900">
          {name}
          {isSelf && (
            <span className="ml-2 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
              you
            </span>
          )}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge status={member.memberRole} labels={MEMBER_ROLE_LABELS} />
          <span className="text-[11px] text-ink-400">
            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "—"}
          </span>
        </div>
      </div>
      {canManage && !isLastOwner && (
        <Button variant="ghost" size="sm" icon={Trash2} onClick={onRemove}>
          <span className="sr-only">Remove</span>
        </Button>
      )}
    </div>
  );
}
