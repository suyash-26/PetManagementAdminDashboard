import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// v2 Flow E. Temporary care with a date range. The one rule that must never break:
// check-in and check-out set the custodian and pet status but never touch
// owner_user_id — boarding is a custody loan, not a transfer.
export default function BoardingPage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Boarding"
        subtitle={
          activeCenter
            ? `Boarding stays at ${activeCenter.name}, with check-in and check-out.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        <ModuleNotReady
          title="The boarding module isn't wired up yet"
          description="The entity, repository, DTOs and mapper exist in Core; the service and controller don't. Availability is computed from approved stays overlapping the requested window plus physically-present pets in custody."
          owner="Boarding module (v2 §9, Dev 6)"
          plannedEndpoints={[
            "POST /boarding-requests",
            "GET  /centers/{id}/availability?from=&to=",
            "POST /boarding-requests/{id}/check-in",
            "POST /boarding-requests/{id}/check-out",
          ]}
        />
      </div>
    </div>
  );
}
