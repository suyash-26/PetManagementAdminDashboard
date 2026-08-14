import { authRequest } from "./http";

// AuthService's super-admin surface — AuthController's /auth/users routes. Both are
// @PreAuthorize("hasRole('SUPER_ADMIN')"), so a caller holding any other role gets a 403
// rather than an empty list. Callers that aren't guaranteed to be super admins (the team
// page, which any center OWNER can reach) must handle that failure instead of assuming
// the list is simply empty.

// GET /auth/users?search= -> UserSummaryResponse[] {id, firstName, middleName, lastName, email, role}
// The search term is one free-text value matched server-side against first name, last
// name, or email. Blank/omitted returns everyone.
export function listUsers(search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return authRequest(`/auth/users${query}`, { method: "GET" });
}

// GET /auth/users/{id} -> UserResponse (includes addresses, unlike the summary above)
export function getUser(userId) {
  return authRequest(`/auth/users/${userId}`, { method: "GET" });
}

// POST /auth/users/{id}/role -> UserResponse
// POST, not PATCH — that's what AuthController maps. The role travels in the JWT's `role`
// claim, so the change only reaches Core after the affected user logs in again; every
// caller should say so.
export function updateUserRole(userId, role) {
  return authRequest(`/auth/users/${userId}/role`, {
    method: "POST",
    body: { role },
  });
}

// Display name for a UserSummaryResponse — the API returns the parts, never a joined name.
export function userLabel(user) {
  if (!user) return "";
  return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");
}
