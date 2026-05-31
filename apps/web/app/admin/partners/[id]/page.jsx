import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requireAdminContext } from "@/lib/supabase/access";
import { PartnerForm } from "@/components/admin-partner-form";
import { PartnerContactsPanel } from "@/components/admin-partner-contacts-panel";
import {
  savePartnerAction,
  deletePartnerAction,
  savePartnerContactAction,
  deletePartnerContactAction,
} from "../actions";

function getNoticeMessage(notice) {
  const messages = {
    saved:             "Partner saved.",
    error:             "Something went wrong. Please try again.",
    "missing-fields":  "Required fields are missing.",
    "contact-saved":   "Contact saved.",
    "contact-deleted": "Contact removed.",
  };
  return messages[notice] || "";
}

export async function generateMetadata({ params }) {
  return { title: "Edit Partner | PATNA Admin" };
}

export default async function AdminPartnerDetailPage({ params, searchParams }) {
  const { supabase } = await requireAdminContext();
  const { id } = await params;
  const resolved = await searchParams;
  const notice = typeof resolved?.notice === "string" ? resolved.notice : "";

  const [{ data: partner }, { data: contacts }] = await Promise.all([
    supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("partner_contacts")
      .select("*")
      .eq("partner_id", id)
      .order("is_primary", { ascending: false })
      .order("full_name", { ascending: true }),
  ]);

  if (!partner) notFound();

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
      subtitle={partner.description || "Manage this partner's profile and contacts."}
      title={partner.name}
    >
      {notice && (
        <p className={notice === "error" || notice === "missing-fields" ? "form-error" : "form-success"}>
          {getNoticeMessage(notice)}
        </p>
      )}

      <div className="partner-detail-grid">
        {/* Partner profile form */}
        <section>
          <h2 className="admin-section-title">Partner profile</h2>
          <PartnerForm action={savePartnerAction} partner={partner} />
        </section>

        {/* Contact persons */}
        <section>
          <h2 className="admin-section-title">Contact persons</h2>
          <PartnerContactsPanel
            contacts={contacts || []}
            deleteAction={deletePartnerContactAction}
            partnerId={partner.id}
            saveAction={savePartnerContactAction}
          />
        </section>
      </div>

      {/* Danger zone */}
      <article className="dashboard-card danger-zone-card">
        <h3>Danger zone</h3>
        <p>Deleting a partner is permanent. All contacts and logo assets will be removed.</p>
        <form action={deletePartnerAction}>
          <input name="partner_id" type="hidden" value={partner.id} />
          <button
            className="danger-button"
            onClick={(e) => {
              if (!window.confirm(`Delete ${partner.name}? This cannot be undone.`)) {
                e.preventDefault();
              }
            }}
            type="submit"
          >
            Delete partner
          </button>
        </form>
      </article>
    </DashboardShell>
  );
}
