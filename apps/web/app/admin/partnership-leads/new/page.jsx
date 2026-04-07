import { saveAdminPartnershipLeadAction } from "@/app/admin/partnership-leads/actions";
import { PartnershipLeadForm } from "@/app/admin/partnership-leads/components/partnership-lead-form";

export default function NewPartnershipLeadPage() {
  return (
    <PartnershipLeadForm
      action={saveAdminPartnershipLeadAction}
      redirectTo="/admin/partnership-leads"
      notice="saved"
    />
  );
}