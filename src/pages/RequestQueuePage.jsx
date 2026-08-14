import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// The most important screen in the finished admin app: v2 §7 makes INTAKE, ADOPTION,
// BOARDING and GENERAL share one approval state machine, so one queue serves all four.
// Wiring it means replacing <ModuleNotReady> with a table fed by
// requests.listCenterRequests(activeCenterId, { status, type }).
export default function RequestQueuePage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Request Queue"
        subtitle={
          activeCenter
            ? `Every request routed to ${activeCenter.name} — intake, adoption, boarding, and general.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        <ModuleNotReady
          title="The shared request engine isn't wired up yet"
          description="Every request type flows through one approval state machine: PENDING → APPROVED → COMPLETED. Approving is only a promise — nothing transfers until the handover is completed."
          owner="Request engine + Custody (v2 §9, Dev 4)"
          plannedEndpoints={[
            "GET  /centers/{id}/requests?status=&type=",
            "POST /requests/{id}/approve",
            "POST /requests/{id}/reject",
            "POST /requests/{id}/complete",
            "GET  /requests/{id}/history",
          ]}
        />
      </div>
    </div>
  );
}
