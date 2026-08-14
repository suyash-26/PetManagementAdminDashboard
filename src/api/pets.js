import { coreRequest } from "./http";

// Only the read side of petManagementService's /pets module is useful to an admin: a
// request carries a bare petId, so the queue needs this to show a name instead of a UUID.
// Creating and editing pets belongs to their owner in the user dashboard.

// GET /pets/{id} -> PetResponse. Any authenticated caller — not owner-scoped — which is
// what lets a center admin read a pet that was handed to them.
export function getPet(id) {
  return coreRequest(`/pets/${id}`, { method: "GET" });
}

// Resolves several ids at once for a list of requests, tolerating individual failures: a
// missing or unreadable pet must degrade to showing its id, not blank the whole queue.
export async function getPetsByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  const results = await Promise.all(unique.map((id) => getPet(id).catch(() => null)));
  const byId = {};
  for (const pet of results) {
    if (pet) byId[pet.id] = pet;
  }
  return byId;
}
