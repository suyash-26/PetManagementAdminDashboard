/* eslint-disable no-unused-vars -- see the note in intake.js: these are the real
   signatures, kept intact until the endpoints exist. */
import { coreRequest } from "./http";

// NOT WIRED YET for the admin side. Core has a /requests controller (another
// developer's track, v2 §9 Dev 4), but the center-scoped admin queue below is the piece
// this dashboard needs and it doesn't exist yet.
//
// This is the single most important screen in the admin app once it lands: v2 §7 makes
// every request type — INTAKE, ADOPTION, BOARDING, GENERAL — share one approval state
// machine (PENDING -> APPROVED -> COMPLETED), so one queue serves all of them.

function notImplemented(what) {
  throw new Error(`${what} is not available yet — the request engine is still being built.`);
}

// GET /centers/{id}/requests?status=&type= — the unified admin queue
export function listCenterRequests(centerId, { status, type } = {}) {
  notImplemented("The request queue");
  // const query = new URLSearchParams({
  //   ...(status ? { status } : {}),
  //   ...(type ? { type } : {}),
  // });
  // return coreRequest(`/centers/${centerId}/requests?${query}`, { method: "GET" });
}

// POST /requests/{id}/approve — a promise, not a transfer. Nothing moves yet.
export function approve(requestId, notes) {
  notImplemented("Approving a request");
  // return coreRequest(`/requests/${requestId}/approve`, { method: "POST", body: { notes } });
}

// POST /requests/{id}/reject — v2 §7 requires a remark on rejection
export function reject(requestId, remark) {
  notImplemented("Rejecting a request");
  // return coreRequest(`/requests/${requestId}/reject`, { method: "POST", body: { remark } });
}

// POST /requests/{id}/complete — the handover. All custody effects happen here, in one
// transaction, never on approve.
export function complete(requestId) {
  notImplemented("Completing a request");
  // return coreRequest(`/requests/${requestId}/complete`, { method: "POST" });
}

// POST /requests/{id}/cancel
export function cancel(requestId) {
  notImplemented("Cancelling a request");
  // return coreRequest(`/requests/${requestId}/cancel`, { method: "POST" });
}

// GET /requests/{id}/history — the immutable status-transition audit trail
export function history(requestId) {
  notImplemented("Request history");
  // return coreRequest(`/requests/${requestId}/history`, { method: "GET" });
}
