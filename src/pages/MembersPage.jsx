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
import { MEMBER_ROLES, MEMBER_ROLE_LABELS } from "../constants/labels";
import { useAuth } from "../context/AuthContext";
import { useCenter } from "../context/CenterContext";

// Team management for the active center.
//   GET    /centers/{id}/members             — any center admin
//   POST   /centers/{id}/members             — OWNER only
//   DELETE /centers/{id}/members/{memberId}  — OWNER only, refused for the last OWNER
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

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await centersApi.addMember(activeCenterId, { userId: newUserId, memberRole: newRole });
      setNewUserId("");
      setNewRole("STAFF");
      setShowForm(false);
      await refresh();
      toast("Team member added.");
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
            <Field
              label="User ID"
              required
              className="sm:col-span-2"
              htmlFor="userId"
              // Core stores user_id as a plain reference with no FK to the Auth
              // database, so it can't resolve names or validate the id before you submit.
              hint="Their numeric account ID from the auth service. Double-check it — there's no name lookup yet, so a wrong ID adds the wrong person."
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
              <Button type="submit" icon={UserPlus} loading={submitting}>
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

                return (
                  <tr key={member.id} className="transition-colors hover:bg-white/45">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`U ${member.userId}`} seed={String(member.userId)} />
                        <div>
                          <p className="text-[13.5px] font-bold text-ink-900">
                            User #{member.userId}
                            {isSelf && (
                              <span className="ml-2 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
                                you
                              </span>
                            )}
                          </p>
                          <p className="font-mono text-[11px] text-ink-400">
                            {member.id.slice(0, 8)}…
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
            ? `User #${pendingRemoval.userId} will immediately lose access to ${activeCenter?.name ?? "this center"}. You can add them back later.`
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

function MemberRowMobile({ member, isSelf, isLastOwner, canManage, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar name={`U ${member.userId}`} seed={String(member.userId)} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink-900">
          User #{member.userId}
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
