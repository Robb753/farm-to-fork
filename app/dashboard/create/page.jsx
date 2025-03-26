// app/dashboard/farms/create/page.jsx
import FarmerOnlySection from "@/components/FarmerOnlySection";
import FarmForm from "@/components/FarmForm";

export default function CreateFarmPage() {
  return (
    <FarmerOnlySection>
      <h1>Ajouter une nouvelle ferme</h1>
      <FarmForm />
    </FarmerOnlySection>
  );
}
