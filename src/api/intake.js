import { coreRequest } from "./http";

// petManagementService's IntakeRequestController. Creation is the user dashboard's job;
// this module covers the center's review queue.
//
// Approve/reject/cancel/complete are NOT here: intake shares the generic approval engine,
// so they live in api/requests.js and act on the same request id.

// GET /intake/centers/{id}/intake-requests?status= -> IntakeRequestResponse[]
// SUPER_ADMIN won't do — like the rest of the queue this is
// @PreAuthorize("hasRole('CENTER_ADMIN')"), matched against the literal JWT role claim.
//
// Worth having alongside the generic queue because only this response carries the
// intake-specific fields — reason, custodyMode, handoverDate, ownerNotes, vetRecordsUrl.
// RequestResponse has none of them.
export function listIntakeRequests(centerId, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return coreRequest(`/intake/centers/${centerId}/intake-requests${query}`, { method: "GET" });
}

// GET /intake/centers/{id}/custody
// The endpoint exists but answers 501 with a plain-text body: the custody roster needs the
// pet module's custodian_center_id lookup, which isn't built. Kept mapped so the gap is
// visible, and so the page's error message comes from the server rather than being
// invented here.
export function listCustodyRoster(centerId) {
  return coreRequest(`/intake/centers/${centerId}/custody`, { method: "GET" });
}
