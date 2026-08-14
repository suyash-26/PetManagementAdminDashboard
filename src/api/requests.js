import { coreRequest } from "./http";

// The shared approval engine — petManagementService's RequestController. One set of
// endpoints serves every request type (INTAKE/ADOPTION/BOARDING/GENERAL), which is the
// point of the polymorphic Request in v2 §7.
//
// Paths differ from v2 §8's table: the controller is mapped at /requests, so the center
// queue is /requests/centers/{id}/requests, not /centers/{id}/requests. The doc's paths
// were never implemented as written.
//
// Authorization, and the reason a 403 here is expected rather than a bug: every endpoint
// below except cancel is @PreAuthorize("hasRole('CENTER_ADMIN')"), and Core builds
// authorities as exactly ROLE_<jwt role claim> with no hierarchy. So a SUPER_ADMIN does
// NOT satisfy it, and neither does a center OWNER whose platform role is USER — only an
// account whose AuthService role is literally CENTER_ADMIN can act on this queue.

// GET /requests/centers/{id}/requests?status=&type= -> RequestResponse[]
// The unified queue. Both filters optional; omit them for every request at this center.
export function listCenterRequests(centerId, { status, type } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  const query = params.toString();
  return coreRequest(`/requests/centers/${centerId}/requests${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

// POST /requests/{id}/approve -> RequestResponse
// PENDING -> APPROVED only; anything else is 409 ILLEGAL_TRANSITION. Approval is a
// promise: RequestService.approve() deliberately does not touch the pet yet (the custody
// effects are a documented gap pending the custody module).
export function approve(requestId) {
  return coreRequest(`/requests/${requestId}/approve`, { method: "POST" });
}

// POST /requests/{id}/reject -> RequestResponse
// Body is RequestActionRequest { notes } — not { remark }. Optional server-side, but the
// remark is stored on the request's notes and is the only explanation the requester gets.
export function reject(requestId, notes) {
  return coreRequest(`/requests/${requestId}/reject`, {
    method: "POST",
    body: { notes: notes?.trim() || null },
  });
}

// POST /requests/{id}/cancel -> RequestResponse
// The one endpoint here with no role gate: allowed for the requester or any center admin.
// PENDING/APPROVED only.
export function cancel(requestId) {
  return coreRequest(`/requests/${requestId}/cancel`, { method: "POST" });
}

// POST /requests/{id}/complete -> RequestResponse
// APPROVED -> COMPLETED. This is where custody/ownership transfer belongs; today it only
// finalizes the request record — see the GAP comment in RequestService.complete().
export function complete(requestId) {
  return coreRequest(`/requests/${requestId}/complete`, { method: "POST" });
}

// GET /requests/{id}/history -> RequestResponse[]
// Not an audit trail yet: request_status_history doesn't exist, so the service returns a
// single-entry list holding the request's current snapshot. Nothing in the UI calls this
// because it can't show anything a row doesn't already show.
export function history(requestId) {
  return coreRequest(`/requests/${requestId}/history`, { method: "GET" });
}
