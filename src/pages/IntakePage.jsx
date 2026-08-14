import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// v2 Flow B. An owner offers a pet; an admin reviews against capacity and policy,
// approves (pet → PENDING_INTAKE, nothing has physically moved), then completes on the
// actual handover — at which point custody and ownership transfer in one transaction.
export default function IntakePage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Intake"
        subtitle={
          activeCenter
            ? `Pets being handed to ${activeCenter.name} for rehoming, surrender, or emergency.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        <ModuleNotReady
          title="The intake module isn't wired up yet"
          description="Owners raise an intake request with a reason (rehoming, surrender, emergency) and a custody mode. Foster-in-place lets the center take legal responsibility while the pet stays with its owner, so it consumes no kennel slot."
          owner="Intake module (v2 §9, Dev 6)"
          plannedEndpoints={[
            "GET  /centers/{id}/intake-requests?status=",
            "POST /requests/{id}/approve",
            "POST /requests/{id}/complete",
          ]}
        />
      </div>
    </div>
  );
}
