# PetMgmt — Admin Dashboard

Care center / NGO console for the PetCare Management System (v2, center-mediated
transfers). Companion to the user dashboard; same stack, same auth service, different
audience.

## Stack

React 19 · Vite 8 · React Router 7 · Tailwind 4 — deliberately identical to
`PetManagementUserDashboard` so the two apps stay easy to diff.

## Running it

Requires **Node 20+** (Vite 8's rolldown bundler won't run on Node 18).

```bash
nvm use 20
npm install
cp .env.example .env.local   # adjust ports if your backends differ
npm run dev                  # http://localhost:5174
```

Port 5174, not 5173 — the user dashboard owns that one and both are usually run together.

### Backend prerequisites

1. **authService** on `:8080` — issues the JWT
2. **petManagementService** (Core) on `:8081` — centers and members
3. Core's CORS allowlist must include `http://localhost:5174`, in
   `SecurityConfig.corsConfigurationSource()`. Without it every call fails preflight.

## What's actually wired

Only the **CareCenter** and **CenterMember** modules exist in Core today, so only those
are live here.

| Screen | Status | Endpoints |
| --- | --- | --- |
| Login | live | `POST /auth/login`, `GET /auth/me` |
| Overview | live | derived from memberships |
| My Centers | live | `GET /centers/mine`, `GET /centers/{id}` |
| Register / edit center | live | `POST /centers`, `PUT /centers/{id}` |
| Center detail | live | `GET /centers/{id}` |
| Team | live | `GET/POST /centers/{id}/members`, `DELETE .../{memberId}` |
| Approve Centers (super admin) | live | `PATCH /centers/{id}/status` |
| Request Queue | structure only | request engine not built |
| Intake | structure only | intake module not built |
| Custody Roster | structure only | custody module not built |
| Adoption Listings | structure only | adoption module not built |
| Boarding | structure only | boarding service/controller not built |
| Care Logs | structure only | CareLog entity doesn't exist yet |

Every "structure only" page is real routing, real layout, and a real API module with the
planned endpoint transcribed from v2 §8 — just commented out. Wiring one up means
uncommenting the call and replacing `<ModuleNotReady>` with a table.

## Two things worth knowing

**Being a center admin is not a role.** Per v2 §3, holding a `center_members` row is what
makes someone one. So the app has no `CENTER_ADMIN` route guard — any authenticated user
gets in, and a person with no memberships is shown center registration instead of a
dashboard. Creating a center grants an `OWNER` membership in the same transaction. The
only role gate is `SUPER_ADMIN`, mirroring the backend's `@PreAuthorize`.

**User ids are `Long`, center ids are `UUID`.** authService issues numeric user ids;
Core's own entities use UUIDs. Core stores `user_id` as a plain column with no foreign
key (the two databases are independent), which is why adding a team member asks for a
numeric ID and can't show names — there's no user lookup endpoint yet.

## Known gaps

- `GET /centers/mine` must exist in Core for the center switcher to work
- No admin-facing center search, so pending centers can't be listed for approval — the
  super-admin page looks them up by ID instead
- No pagination anywhere
