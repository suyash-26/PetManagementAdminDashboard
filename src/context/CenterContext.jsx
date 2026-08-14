import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as centersApi from "../api/centers";
import { useAuth } from "./AuthContext";

const CenterContext = createContext(null);

const ACTIVE_CENTER_KEY = "petmgmt_admin_active_center";

// Almost every admin screen is scoped to one center — the request queue, the custody
// roster, listings, members. Rather than each page re-deriving "which center am I acting
// as?", it is resolved once here and exposed to all of them.
//
// The memberships list is also what makes someone a center admin at all (v2 §3), so an
// empty list is a meaningful state, not an error: it means "you administer nothing yet",
// and the UI offers center creation instead of a dashboard.
export function CenterProvider({ children }) {
  const { user } = useAuth();

  const [memberships, setMemberships] = useState([]);
  const [centers, setCenters] = useState({}); // centerId -> CareCenterResponse
  const [activeCenterId, setActiveCenterId] = useState(
    () => localStorage.getItem(ACTIVE_CENTER_KEY) ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setCenters({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const rows = await centersApi.listMyMemberships();
      setMemberships(rows);

      // Memberships carry only centerId — fetch each center for its name and status so
      // the switcher can show something human. allSettled so one failure (e.g. a center
      // deleted out from under a stale membership) doesn't blank the whole switcher.
      const results = await Promise.allSettled(
        rows.map((row) => centersApi.getCenter(row.centerId)),
      );
      const byId = {};
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          byId[result.value.id] = result.value;
        }
      });
      setCenters(byId);

      // Keep the stored choice only if it is still one of ours; otherwise fall back to
      // the first membership so the app is never in a "scoped to nothing" state.
      setActiveCenterId((current) => {
        if (current && rows.some((row) => row.centerId === current)) return current;
        return rows[0]?.centerId ?? null;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activeCenterId) {
      localStorage.setItem(ACTIVE_CENTER_KEY, activeCenterId);
    } else {
      localStorage.removeItem(ACTIVE_CENTER_KEY);
    }
  }, [activeCenterId]);

  const value = useMemo(() => {
    const activeMembership =
      memberships.find((row) => row.centerId === activeCenterId) ?? null;

    return {
      memberships,
      centers,
      loading,
      error,
      refresh,
      activeCenterId,
      setActiveCenterId,
      activeCenter: activeCenterId ? (centers[activeCenterId] ?? null) : null,
      activeMembership,
      // OWNER gates member management; STAFF can do day-to-day work but not restructure
      // the team. Mirrors CenterGuard.requireCenterOwner on the backend.
      isOwnerOfActiveCenter: activeMembership?.memberRole === "OWNER",
      hasAnyCenter: memberships.length > 0,
    };
  }, [memberships, centers, activeCenterId, loading, error, refresh]);

  return <CenterContext.Provider value={value}>{children}</CenterContext.Provider>;
}

export function useCenter() {
  const ctx = useContext(CenterContext);
  if (!ctx) throw new Error("useCenter must be used within a CenterProvider");
  return ctx;
}
