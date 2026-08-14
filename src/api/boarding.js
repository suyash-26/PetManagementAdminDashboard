/* eslint-disable no-unused-vars -- see the note in intake.js: these are the real
   signatures, kept intact until the endpoints exist. */
import { coreRequest } from "./http";

// PARTIALLY BUILT — the boarding entity, repository, DTOs and mapper exist in Core, but
// BoardingRequestService and its controller do not yet, so nothing here is callable.
// Paths come from v2 §8.

function notImplemented(what) {
  throw new Error(`${what} is not available yet — the boarding module is still being built.`);
}

// GET /centers/{id}/requests?type=BOARDING — boarding requests come through the shared
// request queue; there is no separate "list boarding requests" endpoint.
export function listBoardingRequests(centerId, status) {
  notImplemented("Boarding requests");
  // const query = new URLSearchParams({ type: "BOARDING", ...(status ? { status } : {}) });
  // return coreRequest(`/centers/${centerId}/requests?${query}`, { method: "GET" });
}

// GET /centers/{id}/availability?from=&to= — kennel occupancy for a date window.
// Occupancy counts approved boardings overlapping the window plus physically-present
// pets in custody (v2 §6.3).
export function getAvailability(centerId, from, to) {
  notImplemented("Availability");
  // return coreRequest(`/centers/${centerId}/availability?from=${from}&to=${to}`, { method: "GET" });
}

// POST /boarding-requests/{id}/check-in — sets custodian and pet status to IN_BOARDING.
// Must NOT touch owner_user_id: boarding is a custody loan, not a transfer (v2 §6.1).
export function checkIn(requestId) {
  notImplemented("Check-in");
  // return coreRequest(`/boarding-requests/${requestId}/check-in`, { method: "POST" });
}

// POST /boarding-requests/{id}/check-out — clears custodian, pet returns to OWNED.
export function checkOut(requestId) {
  notImplemented("Check-out");
  // return coreRequest(`/boarding-requests/${requestId}/check-out`, { method: "POST" });
}

// POST /care-logs and GET /boarding-requests/{id}/care-logs
export function listCareLogs(requestId) {
  notImplemented("Care logs");
  // return coreRequest(`/boarding-requests/${requestId}/care-logs`, { method: "GET" });
}

export function addCareLog(payload) {
  notImplemented("Adding a care log");
  // return coreRequest("/care-logs", { method: "POST", body: payload });
}
