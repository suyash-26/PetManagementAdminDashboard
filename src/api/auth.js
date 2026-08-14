import { authRequest } from "./http";

// Identical contract to the user dashboard — the admin app talks to the same authService.
// The only difference is which role the logged-in person holds:
//   POST /auth/login -> {token, id, name}
//   GET  /auth/me    -> UserResponse {id, firstName, middleName, lastName, email, role, ...}
//
// There is deliberately no register() here. Admins are not self-serve: a person signs up
// through the user dashboard, and becomes a center admin either by creating a center
// (which makes them its OWNER) or by being added to one via POST /centers/{id}/members.

export function login(email, password) {
  return authRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
}

export function fetchMe() {
  return authRequest("/auth/me", { method: "GET" });
}
