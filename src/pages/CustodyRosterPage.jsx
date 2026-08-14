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
        <ModuleNotReady
          title="The custody roster isn't wired up yet"
          description="A pet only becomes listable for adoption once it is in a center's custody — that single invariant is what makes peer-to-peer adoption structurally impossible."
          owner="Intake module + CustodyService (v2 §9, Dev 4/6)"
          plannedEndpoints={[
            "GET /centers/{id}/custody",
            "GET /pets/{id}/custody-history",
          ]}
        />
      </div>
    </div>
  );
}
