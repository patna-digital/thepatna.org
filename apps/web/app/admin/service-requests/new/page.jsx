import { saveAdminServiceRequestAction } from "@/app/admin/service-requests/actions";
import { ServiceRequestForm } from "@/app/admin/service-requests/components/service-request-form";

export default function NewServiceRequestPage() {
  return (
    <ServiceRequestForm
      action={saveAdminServiceRequestAction}
      redirectTo="/admin/service-requests"
      notice="saved"
    />
  );
}