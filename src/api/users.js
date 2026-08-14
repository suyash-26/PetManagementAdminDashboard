// ⚠️ MOCK MODULE — no real backend behind any of this.
//
// AuthService currently exposes only /auth/register, /auth/login and /auth/me. There is
// no endpoint to list users or change a role: registration hardcodes Role.USER, and
// SUPER_ADMIN exists only where DataInitializer seeded it. So this file fakes both calls
// against an in-memory array to let the UI be built and reviewed now.
//
// Because the data is in memory, changes vanish on refresh. That is deliberate — it
// makes it obvious the backend isn't wired, rather than looking real until someone
// checks the database.
//
// To go live, delete MOCK_USERS and the delay(), and uncomment the authRequest calls.
// The function signatures and return shapes are already what the real endpoints should
// use, so no page needs to change.

// import { authRequest } from "./http";

// Mirrors AuthService's DataInitializer seed so the mock resembles a real environment.
let MOCK_USERS = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@example.com", role: "USER" },
  { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", role: "USER" },
  { id: 3, firstName: "Michael", lastName: "Johnson", email: "michael.johnson@example.com", role: "SUPER_ADMIN" },
  { id: 4, firstName: "Emily", lastName: "Williams", email: "emily.williams@example.com", role: "USER" },
  { id: 5, firstName: "David", lastName: "Brown", email: "david.brown@example.com", role: "USER" },
  { id: 6, firstName: "Sophia", lastName: "Jones", email: "sophia.jones@example.com", role: "USER" },
  { id: 7, firstName: "Daniel", lastName: "Garcia", email: "daniel.garcia@example.com", role: "USER" },
  { id: 8, firstName: "Olivia", lastName: "Miller", email: "olivia.miller@example.com", role: "USER" },
  { id: 9, firstName: "James", lastName: "Davis", email: "james.davis@example.com", role: "SUPER_ADMIN" },
  { id: 10, firstName: "Emma", lastName: "Wilson", email: "emma.wilson@example.com", role: "USER" },
];

// Fake latency so loading states and disabled buttons are actually exercised — with an
// instant mock, spinners never render and broken ones ship unnoticed.
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /auth/users?search= -> UserResponse[]   (super-admin only, doesn't exist yet)
export async function listUsers(search) {
  await delay();
  if (!search) return [...MOCK_USERS];

  const needle = search.toLowerCase();
  return MOCK_USERS.filter(
    (user) =>
      user.email.toLowerCase().includes(needle) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(needle),
  );

  // return authRequest(`/auth/users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
}

// PATCH /auth/users/{id}/role -> UserResponse  (super-admin only, doesn't exist yet)
export async function updateUserRole(userId, role) {
  await delay(600);

  const target = MOCK_USERS.find((user) => user.id === userId);
  if (!target) {
    throw new Error("User not found");
  }

  // The real endpoint must enforce this server-side too: a super admin who demotes
  // themselves loses the ability to undo it, and if they were the last one the platform
  // has nobody left who can approve centers.
  MOCK_USERS = MOCK_USERS.map((user) => (user.id === userId ? { ...user, role } : user));
  return { ...target, role };

  // return authRequest(`/auth/users/${userId}/role`, { method: "PATCH", body: { role } });
}

// Exported so the page can warn before the last super admin is demoted. Once the real
// API exists this check belongs on the server — the client copy is only a courtesy.
export function countSuperAdmins() {
  return MOCK_USERS.filter((user) => user.role === "SUPER_ADMIN").length;
}
