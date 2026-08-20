import { coreRequest } from "./http";

// v2 Flow E — petManagementService's BoardingRequestController.
//
// Approve/reject/cancel go through the shared engine in api/requests.js. What lives here
// is what boarding alone has: the two physical events (check-in, check-out) and kennel
// availability.
//
// The rule the whole module rests on (v2 §6.1): check-in sets the custodian and moves the
// pet to IN_BOARDING but NEVER touches ownerUserId. A boarding stay is a custody loan, so
// IN_BOARDING is the only pet status where owner and custodian are both set.

// GET /centers/{id}/boarding-requests?status= -> BoardingRequestResponse[]
//
// Not the generic queue: GET /requests/centers/{id}/requests?type=BOARDING returns
// RequestResponse, which carries no startDate, endDate, checkedInAt or checkedOutAt — so
// reviewing boarding from there means deciding without knowing the dates.
export function listBoardingRequests(centerId, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return coreRequest(`/centers/${centerId}/boarding-requests${query}`, { method: "GET" });
}

// GET /centers/{id}/availability?from=&to= -> CenterAvailabilityResponse
//
// Occupancy = approved boardings overlapping the window + pets physically held in custody,
// against care_centers.capacity (v2 §6.3).
//
// Reported, not enforced: the server does not yet throw NO_CAPACITY, and the custody count
// over-reports because FOSTER_IN_PLACE intakes consume no kennel slot but there is no
// physically_present flag to exclude them. Treat the number as advisory.
export function getAvailability(centerId, from, to) {
  const query = new URLSearchParams({ from, to });
  return coreRequest(`/centers/${centerId}/availability?${query}`, { method: "GET" });
}

// POST /boarding-requests/{id}/check-in -> BoardingRequestResponse
// Only from an APPROVED request, and only once (409 ALREADY_CHECKED_IN otherwise).
export function checkIn(requestId) {
  return coreRequest(`/boarding-requests/${requestId}/check-in`, { method: "POST" });
}

// POST /boarding-requests/{id}/check-out -> BoardingRequestResponse
//
// Clears the custodian, returns the pet to OWNED — by the same owner it always had — and
// completes the request through the shared engine, so its status history matches every
// other request type. Requires a prior check-in (409 NOT_CHECKED_IN).
export function checkOut(requestId) {
  return coreRequest(`/boarding-requests/${requestId}/check-out`, { method: "POST" });
}

/* eslint-disable no-unused-vars -- real signatures, kept intact until the endpoints exist */

// POST /care-logs and GET /boarding-requests/{id}/care-logs
//
// STILL MISSING FROM CORE: there is no CareLog entity at all, so an owner has no timeline
// to watch during a stay. Left throwing rather than silently returning [] — an empty
// timeline would read as "no care given" instead of "not built".
function notImplemented(what) {
  throw new Error(`${what} is not available yet — care logs are not implemented in Core.`);
}

export function listCareLogs(requestId) {
  notImplemented("Care logs");
}

export function addCareLog(payload) {
  notImplemented("Adding a care log");
}
