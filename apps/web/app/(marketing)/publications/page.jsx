import { MarketingPageHero } from "@/components/marketing-page-hero";
import { SectionIntro } from "@/components/section-intro";
import { PublicationCard, FeaturedPublicationCard } from "@/components/publication-card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Publications | PATNA",
  description:
    "Briefs, reports, case studies, and articles from PATNA's work on African maritime decarbonisation.",
};

async function fetchPublicPublications() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(`*, content_attachments(*), content_tag_map(domain_tags(id, name, slug))`)
    .eq("publish_status", "published")
    .eq("visibility", "public")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch public publications:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    attachments: item.content_attachments || [],
    tags: item.content_tag_map?.map((t) => t.domain_tags).filter(Boolean) || [],
  }));
}

export default async function PublicationsPage() {
  const publications = await fetchPublicPublications();
  const [featured, ...rest] = publications;

  return (
    <>
      <MarketingPageHero
        label="Publications"
        subtitle="Briefs, reports, and commentary from PATNA's work on African maritime decarbonisation and just transition."
        title="Publications Library"
      />

      {featured && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label="Latest"
              title="Most recent publication"
            />
            <FeaturedPublicationCard
              href={`/publications/${featured.slug}`}
              publication={featured}
            />
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <SectionIntro
              label="Archive"
              title="All publications"
              subtitle="The full library of PATNA knowledge products, ordered by publication date."
            />
            <div className="publications-grid">
              {rest.map((pub) => (
                <PublicationCard
                  href={`/publications/${pub.slug}`}
                  key={pub.id}
                  publication={pub}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {publications.length === 0 && (
        <section className="section">
          <div className="section-inner">
            <p className="muted-note">No publications available yet. Check back soon.</p>
          </div>
        </section>
      )}
    </>
  );
}
