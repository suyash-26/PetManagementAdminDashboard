import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// Daily activity entries by center staff. In v2 these cover any pet in custody, not
// just boarding stays — feeding, walks, medical, grooming, notes. Owners watch a live
// timeline of their boarded pet.
export default function CareLogsPage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Care Logs"
        subtitle={
          activeCenter
            ? `Daily entries recorded by ${activeCenter.name}'s staff.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        <ModuleNotReady
          title="Care logs aren't wired up yet"
          description="Neither the CareLog entity nor the CareActivity enum (FEEDING, WALK, MEDICAL, GROOMING, NOTE) exists in Core yet. They ship with the boarding module."
          owner="Boarding module (v2 §9, Dev 6)"
          plannedEndpoints={[
            "POST /care-logs",
            "GET  /boarding-requests/{id}/care-logs",
          ]}
        />
      </div>
    </div>
  );
}
