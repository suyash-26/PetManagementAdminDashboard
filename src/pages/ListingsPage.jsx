import PageHeader from "../components/PageHeader";
import ModuleNotReady from "../components/ModuleNotReady";
import { useCenter } from "../context/CenterContext";

// v2 Flow C + D. Only a center may list a pet, and only one it already holds. Competing
// applicants appear side by side; approving one reserves the listing, and ownership
// moves only on completion after the physical handover.
export default function ListingsPage() {
  const { activeCenter } = useCenter();

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Adoption Listings"
        subtitle={
          activeCenter
            ? `Pets ${activeCenter.name} has listed, and the people applying for them.`
            : "Select a center."
        }
      />
      <div className="mt-6">
        <ModuleNotReady
          title="The adoption module isn't wired up yet"
          description="Listing a pet requires it to already be in this center's custody — otherwise the API returns PET_NOT_IN_YOUR_CUSTODY. Approval reserves the pet; ownership transfers only when the handover is completed."
          owner="Adoption module (v2 §9, Dev 5)"
          plannedEndpoints={[
            "POST  /centers/{id}/listings",
            "GET   /listings?centerId=",
            "GET   /listings/{id}/applicants",
            "PATCH /listings/{id}",
          ]}
        />
      </div>
    </div>
  );
}
