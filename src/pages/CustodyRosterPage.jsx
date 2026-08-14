import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// Every pet this center currently holds. v2 §6.1: legal owner and current custodian are
// different things — during boarding the center holds a pet the user still owns, while
// after an intake the center holds and owns it.
export default function CustodyRosterPage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Custody Roster"
        subtitle={
          activeCenter
            ? `Pets currently in ${activeCenter.name}'s custody.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        {/* Not merely unbuilt: the route is mapped and deliberately answers 501, because
            a roster means querying pets by custodian_center_id — and nothing sets that
            column yet, since completing an intake doesn't transfer custody. Wiring a
            fetch here would render an empty table that looked correct. */}
        <ModuleNotReady
          title="The custody roster isn't wired up yet"
          description="The endpoint exists but answers 501 by design: a roster is 'pets whose custodian is this center', and no code sets a custodian yet — the transfer that would do it is the same gap that makes completing an intake a record-only change. A pet must be in a center's custody before it can be listed for adoption, which is the invariant that makes peer-to-peer adoption structurally impossible."
          owner="Intake module + CustodyService (v2 §9, Dev 4/6)"
          plannedEndpoints={[
            "GET /intake/centers/{id}/custody   → 501 today",
            "GET /pets/{id}/custody-history     → not mapped",
          ]}
        />
      </div>
    </div>
  );
}
