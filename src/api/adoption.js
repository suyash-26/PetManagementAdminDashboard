/* eslint-disable no-unused-vars -- see the note in intake.js: these are the real
   signatures, kept intact until the endpoints exist. */
import { coreRequest } from "./http";

// NOT WIRED YET — the adoption module is another developer's track (v2 §9, Dev 5).
// Paths transcribed from v2 §8 so the contract is fixed even though the endpoints
// don't exist yet.

function notImplemented(what) {
  throw new Error(`${what} is not available yet — the adoption module is still being built.`);
}

// POST /centers/{id}/listings — admin-only in v2. There is deliberately no user-facing
// listing-creation endpoint anywhere in the system: that omission, plus the custody
// invariant below, is the whole enforcement of "no direct user-to-user adoption".
export function createListing(centerId, payload) {
  notImplemented("Creating an adoption listing");
  // return coreRequest(`/centers/${centerId}/listings`, { method: "POST", body: payload });
}

// GET /listings?centerId= — the public feed, filtered to this center for the admin view
export function listListings(centerId) {
  notImplemented("Adoption listings");
  // return coreRequest(`/listings?centerId=${centerId}`, { method: "GET" });
}

// GET /listings/{id}/applicants — every competing application for one listing, shown
// side by side so the admin can screen them against each other
export function listApplicants(listingId) {
  notImplemented("Adoption applicants");
  // return coreRequest(`/listings/${listingId}/applicants`, { method: "GET" });
}

// PATCH /listings/{id} — delist
export function delist(listingId) {
  notImplemented("Delisting");
  // return coreRequest(`/listings/${listingId}`, { method: "PATCH", body: { listingStatus: "CLOSED" } });
}
