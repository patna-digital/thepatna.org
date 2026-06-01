import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { PartnerForm } from "@/components/admin-partner-form";
import { savePartnerAction } from "../actions";

export const metadata = {
  title: "Add Partner | PATNA Admin",
};

export default async function AdminPartnerNewPage({ searchParams }) {
  await requireAdminContext();
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  const headerActions = (
    <Link className="secondary-button" href="/admin/partners">← All partners</Link>
  );

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Partnerships"
      headerActions={headerActions}
      navItems={adminNav}
      subtitle="Add a new partner to the PATNA registry."
      title="Add partner"
    >
      {notice === "missing-fields" && (
        <p className="form-error">Partner name is required.</p>
      )}
      {notice === "error" && (
        <p className="form-error">Something went wrong. Please try again.</p>
      )}

      <PartnerForm action={savePartnerAction} partner={null} />
    </DashboardShell>
  );
}
