import { saveAdminCollaborationLeadAction } from "@/app/admin/collaboration-leads/actions";
import { CollaborationLeadForm } from "@/app/admin/collaboration-leads/components/collaboration-lead-form";

export default function NewCollaborationLeadPage() {
  return (
    <CollaborationLeadForm
      action={saveAdminCollaborationLeadAction}
      redirectTo="/admin/collaboration-leads"
      notice="saved"
    />
  );
}