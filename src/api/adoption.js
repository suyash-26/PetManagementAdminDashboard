import { coreRequest } from "./http";

// v2 Flow C + D — petManagementService's AdoptionListingController and
// AdoptionRequestController.
//
// The shape of this module reflects the policy: there is a create-listing endpoint under
// /centers/{id}/listings and none under /listings. That omission is deliberate and is the
// whole enforcement of "only a center may list a pet" — do not add a user-facing variant.
//
// Approve/reject/cancel/complete on an application are NOT here: adoption shares the
// generic approval engine, so they live in api/requests.js keyed by the same requestId.

// POST /centers/{id}/listings -> AdoptionListingResponse (201)
//
// The server enforces the custody invariant: pet.custodianCenterId must equal this center
// AND pet.status must be IN_CENTER_CUSTODY, else 409 PET_NOT_IN_YOUR_CUSTODY. So the only
// pets that can be listed are ones this center has actually taken in — which is why the
// custody roster is the natural entry point to this call.
export function createListing(centerId, { petId, description, reason, adoptionFee }) {
  return coreRequest(`/centers/${centerId}/listings`, {
    method: "POST",
    body: {
      petId,
      description: description?.trim() || null,
      reason: reason?.trim() || null,
      // "" would fail @PositiveOrZero on the server; null means "no fee".
      adoptionFee: adoptionFee === "" || adoptionFee == null ? null : Number(adoptionFee),
    },
  });
}

// GET /centers/{id}/listings?status= -> AdoptionListingResponse[]
//
// Deliberately NOT the public GET /listings feed: that one is anonymous and hardcoded to
// OPEN, so an admin would never see their RESERVED or CLOSED listings — precisely the ones
// with an approved adopter mid-handover.
export function listCenterListings(centerId, status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return coreRequest(`/centers/${centerId}/listings${query}`, { method: "GET" });
}

// GET /listings/{id} -> AdoptionListingResponse. Public endpoint, reused here.
export function getListing(listingId) {
  return coreRequest(`/listings/${listingId}`, { method: "GET" });
}

// GET /listings/{id}/applicants -> AdoptionRequestResponse[]
//
// Every competing application for one listing, side by side (Flow D step 2). Scoped
// server-side to admins of this listing's own center, so a 403 here means you are looking
// at another center's listing, not that your role is wrong.
export function listApplicants(listingId) {
  return coreRequest(`/listings/${listingId}/applicants`, { method: "GET" });
}

// PATCH /listings/{id} -> AdoptionListingResponse
//
// Delist. Only from OPEN — a RESERVED listing has an approved adopter, and that
// application has to be cancelled through the request engine first so its own status and
// history stay truthful. The pet returns to IN_CENTER_CUSTODY, not to its old owner.
export function delist(listingId) {
  return coreRequest(`/listings/${listingId}`, { method: "PATCH" });
}
