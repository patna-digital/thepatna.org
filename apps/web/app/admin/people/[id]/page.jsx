import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { PersonProfileForm } from "@/components/admin-person-form";
import { savePersonAction, deletePersonAction } from "../actions";
import { DeletePersonButton } from "./delete-person-button";

const SECTION_LABELS = {
  board:       "Board of Directors",
  secretariat: "Secretariat",
  research:    "Research Contributors",
};

function getNoticeMessage(notice) {
  const map = {
    saved: "Profile saved successfully.",
    error: "Something went wrong. Please try again.",
    "missing-fields": "Name and section are required.",
  };
  return map[notice] || "";
}

export async function generateMetadata({ params }) {
  return { title: "Edit Person | PATNA Admin" };
}

export default async function AdminPersonDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { id } = await params;
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  const { data: person } = await supabase
    .from("people_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!person) notFound();

  const headerActions = (
    <Link className="secondary-button" href="/admin/people">← All people</Link>
  );

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow={SECTION_LABELS[person.section] || "People"}
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Website", href: "/admin/website" },
        { label: "People", href: "/admin/people" },
        { label: person.full_name },
      ]}
      headerActions={headerActions}
      navItems={adminNav}
      subtitle={`${person.title || ""}${person.organisation ? ` · ${person.organisation}` : ""}`}
      title={person.full_name}
    >
      {notice && (
        <p className={notice === "error" || notice === "missing-fields" ? "form-error" : "form-success"}>
          {getNoticeMessage(notice)}
        </p>
      )}

      <PersonProfileForm action={savePersonAction} person={person} />

      {/* Danger zone */}
      <article className="dashboard-card danger-zone-card" style={{ marginTop: "1.25rem" }}>
        <h3>Remove profile</h3>
        <p>Permanently deletes this person's profile and photo. This cannot be undone.</p>
        <DeletePersonButton
          deleteAction={deletePersonAction}
          personId={person.id}
          personName={person.full_name}
        />
      </article>
    </DashboardShell>
  );
}
