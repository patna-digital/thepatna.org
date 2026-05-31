import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { PersonProfileForm } from "@/components/admin-person-form";
import { savePersonAction } from "../actions";

export const metadata = { title: "Add Person | PATNA Admin" };

export default async function AdminPersonNewPage({ searchParams }) {
  await requireAdminContext();
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";
  const defaultSection = typeof resolved?.section === "string" ? resolved.section : "board";

  const headerActions = (
    <Link className="secondary-button" href="/admin/people">← All people</Link>
  );

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Website"
      headerActions={headerActions}
      navItems={adminNav}
      subtitle="Add a new profile to the Board, Secretariat, or Research Contributors."
      title="Add person"
    >
      {notice === "missing-fields" && (
        <p className="form-error">Name and section are required.</p>
      )}
      {notice === "error" && (
        <p className="form-error">Something went wrong. Please try again.</p>
      )}

      <PersonProfileForm action={savePersonAction} defaultSection={defaultSection} person={null} />
    </DashboardShell>
  );
}
