// Enum values mirrored from the backend. Kept in one file so a new enum constant is a
// one-line change here rather than a hunt through the pages.

// CenterStatus — CareCenter/enums/CenterStatus.java
export const CENTER_STATUS_LABELS = {
  PENDING: { label: "Pending approval", color: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  SUSPENDED: { label: "Suspended", color: "bg-rose-100 text-rose-700" },
};

// The transition table enforced by CareCenterService.canTransition(). Mirrored here so
// the UI only offers moves the backend will accept — a button that always 409s is worse
// than no button. The backend remains the authority; this is convenience, not security.
export const ALLOWED_CENTER_TRANSITIONS = {
  PENDING: ["ACTIVE"],
  ACTIVE: ["SUSPENDED"],
  SUSPENDED: ["ACTIVE"],
};

// MemberRole — CareCenter/enums/MemberRole.java
export const MEMBER_ROLE_LABELS = {
  OWNER: { label: "Owner", color: "bg-indigo-100 text-indigo-700" },
  STAFF: { label: "Staff", color: "bg-slate-100 text-slate-700" },
};

export const MEMBER_ROLES = ["OWNER", "STAFF"];

// IntakeReason — intake/enums/IntakeReason.java.
export const INTAKE_REASON_LABELS = {
  REHOMING: { label: "Rehoming", color: "bg-sky-100 text-sky-700" },
  SURRENDER: { label: "Surrender", color: "bg-amber-100 text-amber-700" },
  EMERGENCY: { label: "Emergency", color: "bg-rose-100 text-rose-700" },
};

// CustodyMode — intake/enums/CustodyMode.java. v2 §6.3: only PHYSICAL consumes a kennel
// slot, which is what makes this worth showing on every intake row.
export const CUSTODY_MODE_LABELS = {
  PHYSICAL: { label: "Physical custody", color: "bg-indigo-100 text-indigo-700" },
  FOSTER_IN_PLACE: { label: "Foster in place", color: "bg-emerald-100 text-emerald-700" },
};

// RequestStatus — requests/enums/RequestStatus.java.
export const REQUEST_STATUS_LABELS = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", color: "bg-sky-100 text-sky-700" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "Cancelled", color: "bg-slate-100 text-slate-600" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

// PetStatus — enums/PetStatus.java. v2 §6.1: IN_BOARDING is the only status where a pet
// has both an owner and a custodian, because boarding is a loan and not a transfer.
export const PET_STATUS_LABELS = {
  OWNED: { label: "Owned", color: "bg-slate-100 text-slate-700" },
  PENDING_INTAKE: { label: "Pending intake", color: "bg-amber-100 text-amber-700" },
  IN_CENTER_CUSTODY: { label: "In our custody", color: "bg-indigo-100 text-indigo-700" },
  AVAILABLE_FOR_ADOPTION: { label: "Listed", color: "bg-emerald-100 text-emerald-700" },
  RESERVED: { label: "Reserved", color: "bg-sky-100 text-sky-700" },
  IN_BOARDING: { label: "Boarding", color: "bg-violet-100 text-violet-700" },
};

// Platform roles issued by authService in the JWT's `role` claim.
export const ROLE_SUPER_ADMIN = "SUPER_ADMIN";
export const ROLE_CENTER_ADMIN = "CENTER_ADMIN";
export const ROLE_USER = "USER";

export const PLATFORM_ROLES = [ROLE_USER, ROLE_CENTER_ADMIN, ROLE_SUPER_ADMIN];

export const PLATFORM_ROLE_LABELS = {
  USER: { label: "User", color: "bg-slate-100 text-slate-700" },
  CENTER_ADMIN: { label: "Center admin", color: "bg-sky-100 text-sky-700" },
  SUPER_ADMIN: { label: "Super admin", color: "bg-indigo-100 text-indigo-700" },
};

// Shown next to CENTER_ADMIN in the role picker. Per v2 §3 a person becomes a center
// admin by holding a center_members row, not by carrying this claim — nothing in Core
// reads it, so setting it here grants no access on its own.
export const ROLE_HINTS = {
  USER: "Can own pets and raise requests. The default for every new account.",
  CENTER_ADMIN:
    "Has no effect on its own — center access comes from being added to a center's team.",
  SUPER_ADMIN: "Can approve, suspend, and reinstate care centers across the platform.",
};
