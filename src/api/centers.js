import { coreRequest } from "./http";

// The only fully-wired module in this app. Every function here maps 1:1 onto an endpoint
// that exists today in petManagementService's CareCenterController.

// POST /centers -> CareCenterResponse (201)
// createdBy is taken from the JWT server-side, never sent. The caller is also given an
// OWNER center_members row in the same transaction, so whoever creates a center can
// immediately administer it.
export function createCenter({
  name,
  description,
  address,
  city,
  state,
  contactEmail,
  contactPhone,
  latitude,
  longitude,
  capacity,
}) {
  return coreRequest("/centers", {
    method: "POST",
    body: {
      name,
      description,
      address,
      city,
      state,
      contactEmail: contactEmail || null,
      contactPhone,
      // "" from an untouched number input would fail @DecimalMin; null is the "not supplied" case
      latitude: latitude === "" || latitude == null ? null : Number(latitude),
      longitude: longitude === "" || longitude == null ? null : Number(longitude),
      capacity: Number(capacity),
    },
  });
}

// GET /centers?city= -> CareCenterResponse[]
// Public feed. The backend hardcodes status=ACTIVE on this route, so PENDING and
// SUSPENDED centers never appear here no matter what is passed.
export function listPublicCenters(city) {
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  return coreRequest(`/centers${query}`, { method: "GET" });
}

// GET /centers/{id} -> CareCenterResponse
export function getCenter(id) {
  return coreRequest(`/centers/${id}`, { method: "GET" });
}

// PUT /centers/{id} -> CareCenterResponse. Center admins only (CenterGuard).
// Cannot change status/createdBy — they aren't in the request DTO by design.
export function updateCenter(id, payload) {
  return coreRequest(`/centers/${id}`, {
    method: "PUT",
    body: {
      ...payload,
      contactEmail: payload.contactEmail || null,
      latitude:
        payload.latitude === "" || payload.latitude == null ? null : Number(payload.latitude),
      longitude:
        payload.longitude === "" || payload.longitude == null ? null : Number(payload.longitude),
      capacity: Number(payload.capacity),
    },
  });
}

// PATCH /centers/{id}/status -> CareCenterResponse. SUPER_ADMIN only (@PreAuthorize).
// Legal moves: PENDING->ACTIVE, ACTIVE->SUSPENDED, SUSPENDED->ACTIVE. Anything else
// comes back 409 ILLEGAL_TRANSITION.
export function updateCenterStatus(id, status) {
  return coreRequest(`/centers/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

// GET /centers/mine -> CenterMemberResponse[]
// "Which centers do I administer?" — each row is a membership, carrying centerId and
// this user's role in it. Drives the center switcher.
export function listMyMemberships() {
  return coreRequest("/centers/mine", { method: "GET" });
}

// GET /centers/{id}/members -> CenterMemberResponse[]. Center admins only.
export function listMembers(centerId) {
  return coreRequest(`/centers/${centerId}/members`, { method: "GET" });
}

// POST /centers/{id}/members -> CenterMemberResponse (201). OWNER only.
// userId is authService's Long id, not a UUID — Core stores it as a plain reference
// with no FK, so there is no way for this app to validate it before sending.
export function addMember(centerId, { userId, memberRole }) {
  return coreRequest(`/centers/${centerId}/members`, {
    method: "POST",
    body: { userId: Number(userId), memberRole },
  });
}

// DELETE /centers/{id}/members/{memberId} -> 204. OWNER only.
// Refused with 409 when it would remove the center's last OWNER.
export function removeMember(centerId, memberId) {
  return coreRequest(`/centers/${centerId}/members/${memberId}`, { method: "DELETE" });
}
