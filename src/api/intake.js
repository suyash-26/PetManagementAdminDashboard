/* eslint-disable no-unused-vars -- Parameters and the coreRequest import are the real
   signatures for when these endpoints land; the commented-out call in each function is
   the implementation. Renaming them to _foo now would just have to be undone later. */
import { coreRequest } from "./http";

// NOT WIRED YET — the intake module is another developer's track (v2 §9, Dev 6).
//
// The paths below are transcribed from v2 §8's API surface so the shape is already
// agreed; each function is left throwing rather than calling a URL that would 404, so a
// page that forgets it is unimplemented fails loudly in development instead of showing
// a confusing network error. Delete the notImplemented() line and uncomment the call
// once the endpoint lands.

function notImplemented(what) {
  throw new Error(`${what} is not available yet — the intake module is still being built.`);
}

// GET /centers/{id}/intake-requests?status=
export function listIntakeRequests(centerId, status) {
  notImplemented("Intake queue");
  // const query = status ? `?status=${status}` : "";
  // return coreRequest(`/centers/${centerId}/intake-requests${query}`, { method: "GET" });
}

// GET /centers/{id}/custody — the custody roster (pets this center currently holds)
export function listCustodyRoster(centerId) {
  notImplemented("Custody roster");
  // return coreRequest(`/centers/${centerId}/custody`, { method: "GET" });
}

// POST /requests/{id}/approve — shared approval engine, not intake-specific
export function approveIntake(requestId, notes) {
  notImplemented("Approving an intake request");
  // return coreRequest(`/requests/${requestId}/approve`, { method: "POST", body: { notes } });
}

// POST /requests/{id}/complete — the handover. Custody transfers atomically here, NOT
// on approve (v2 §7 Flow B: approval is a promise, the animal has not moved yet).
export function completeIntake(requestId) {
  notImplemented("Completing an intake handover");
  // return coreRequest(`/requests/${requestId}/complete`, { method: "POST" });
}
