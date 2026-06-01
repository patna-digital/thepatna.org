import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/lib/patna-data";
import { requirePublicationManagerContext } from "@/lib/supabase/access";
import { fetchInsightTags } from "@/lib/insights";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InsightForm } from "../components/insight-form";
import { createInsightAction } from "../[insightId]/actions";

export default async function NewInsightPage() {
  const { supabase } = await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const { tags, error: tagsError } = await fetchInsightTags({ supabase: adminClient });

  if (tagsError) {
    console.error("Failed to fetch tags:", tagsError);
  }

  return (
    <DashboardShell
      brandHref="/admin"
      brandLabel="PATNA Admin"
      eyebrow="Admin workspace"
      navItems={adminNav}
      spotlight={{
        label: "Create insight",
        title: "Add a new knowledge product",
        body: "Create reports, briefs, case studies, or articles for the PATNA insights library.",
      }}
      subtitle="Add a new report, brief, case study, or article to the insights library."
      title="New insight"
    >
      <div className="admin-form-layout">
        <article className="dashboard-card">
          <InsightForm
            action={createInsightAction}
            cancelHref="/admin/insights"
            submitLabel="Create insight"
            tags={tags}
          />
        </article>

        <aside className="admin-form-sidebar">
          <div className="dashboard-card">
            <h3>Creating insights</h3>
            <div className="feature-list">
              <ul>
                <li>Choose the appropriate content type</li>
                <li>Set visibility before publishing</li>
                <li>Add relevant tags for discoverability</li>
                <li>Upload PDFs after creating the insight</li>
              </ul>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Content types</h3>
            <dl className="compact-list">
              <dt>Report</dt>
              <dd>Comprehensive research or analysis</dd>
              <dt>Brief</dt>
              <dd>Short policy or technical brief</dd>
              <dt>Case Study</dt>
              <dd>Country or project-specific analysis</dd>
              <dt>Article</dt>
              <dd>Commentary or blog post</dd>
              <dt>Workshop Proceedings</dt>
              <dd>Event outputs and findings</dd>
            </dl>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
