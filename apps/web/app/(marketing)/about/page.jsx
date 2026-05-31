import Link from "next/link";
import {
  storyTimeline,
  boardMembers   as staticBoardMembers,
  secretariatMembers as staticSecretariatMembers,
  researchLeadership as staticResearchLeadership,
} from "@/lib/patna-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "About",
  description:
    "Learn about PATNA's mission, vision, and Africa-centred approach to maritime decarbonisation, climate action, and energy transition.",
};

const TITLE_SKIP = new Set(["Dr", "Dr.", "Ambassador", "Amb", "Maj", "Gen", "(Rt)", "Prof", "Prof.", "Assoc."]);
const AVATAR_COLORS = ["#d6e8f7", "#dcf5ea", "#e8f5fd", "#fce7d6", "#ede9fe"];
const AVATAR_TEXT_COLORS = ["#023d75", "#1a6b4a", "#03529d", "#92400e", "#5b21b6"];

function getInitials(name = "") {
  return name.split(" ").filter((w) => !TITLE_SKIP.has(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function isChairRole(title = "") {
  return /chair/i.test(title);
}

/**
 * Fetch active people grouped by section from the DB.
 * Falls back to static patna-data arrays if the table is empty or unavailable.
 */
async function fetchPeopleProfiles() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("people_profiles")
      .select("id, section, full_name, title, organisation, bio, email, linkedin_url, photo_url, display_order")
      .eq("is_active", true)
      .order("section")
      .order("display_order");

    if (error || !data?.length) throw new Error("empty or unavailable");

    const board       = data.filter((p) => p.section === "board");
    const secretariat = data.filter((p) => p.section === "secretariat");
    const research    = data.filter((p) => p.section === "research");
    return { board, secretariat, research, fromDb: true };
  } catch {
    // Graceful fallback to static data (migration not yet run, or table empty)
    return {
      board: staticBoardMembers.map((m, i) => ({
        id: String(i), full_name: m.name, title: m.title, organisation: m.org,
        bio: m.bio, email: null, linkedin_url: null, photo_url: null,
      })),
      secretariat: staticSecretariatMembers.map((m, i) => ({
        id: String(i), full_name: m.name, title: m.title, organisation: null,
        bio: m.bio, email: m.contact, linkedin_url: null, photo_url: null,
      })),
      research: staticResearchLeadership.map((m, i) => ({
        id: String(i), full_name: m.name, title: m.title, organisation: null,
        bio: m.body, email: null, linkedin_url: null, photo_url: null,
      })),
      fromDb: false,
    };
  }
}

export default async function AboutPage() {
  const { board, secretariat, research } = await fetchPeopleProfiles();
  return (
    <>
      <section className="sub-page-hero" aria-label="About PATNA">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1523365280197-f1783db9fe62?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">About PATNA</div>
          <h1 className="sub-page-hero-title">
            Building Africa's <em>institutional capacity</em>
          </h1>
          <p className="sub-page-hero-sub">
            The Professional African Technical Network Advisory (PATNA) Initiative is a non-profit organisation of more than 100 African technical experts, policymakers, researchers, and maritime professionals — enabling Africa to shape the rules of the global energy transition.
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION (v3 mist panels) ── */}
      <section className="mv-section-v3" aria-labelledby="about-mv-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">Purpose</div>
          <h2 className="v3-section-title" id="about-mv-heading">Mission &amp; <em>Vision</em></h2>

          <div className="mv-grid-v3">
            <div className="mv-item-v3">
              <div className="mv-item-v3-label">Mission</div>
              <h3 className="mv-item-v3-title">Our mission</h3>
              <p className="mv-item-v3-text">
                To strengthen Africa's agency in global energy transition and climate governance — by building the coordinated, evidence-based positions, the institutional networks, and the technical capacity that allow African states to participate as architects of international frameworks, not inheritors of them.
              </p>
              <p className="mv-item-v3-text">
                The PATNA Initiative exists because the gap between Africa's exposure to global climate rules and Africa's influence over them is not a natural condition. It is the consequence of under-investment in coordination, evidence, and advisory capacity. The PATNA Initiative closes that gap.
              </p>
            </div>
            <div className="mv-item-v3">
              <div className="mv-item-v3-label">Vision</div>
              <h3 className="mv-item-v3-title">Our vision</h3>
              <p className="mv-item-v3-text">
                A world in which Africa's participation in global energy transition and climate governance decisions demonstrably strengthens successively — where the technical capacity, coordinated positions, and institutional credibility that The PATNA Initiative builds are reflected in the language, mechanisms, and equity provisions of the frameworks that govern Africa's maritime and energy future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR STORY (v3 timeline + narrative) ── */}
      <section className="story-section-v3" aria-labelledby="about-story-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">Our Story</div>
          <h2 className="v3-section-title" id="about-story-heading">
            From a bold intervention to a <em>continental institution</em>
          </h2>

          <div className="story-grid-v3">
            {/* Timeline */}
            <div className="story-timeline-v3" aria-label="PATNA timeline">
              {storyTimeline.map((item, i) => (
                <div className={`tl-item-v3${item.active ? " active" : ""}`} key={i}>
                  <div className="tl-dot-v3">{item.year.slice(-2)}</div>
                  <div className="tl-content-v3">
                    <div className="tl-year-v3">{item.year}</div>
                    <div className="tl-title-v3">{item.title}</div>
                    <div className="tl-desc-v3">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Narrative */}
            <div className="story-content-v3">
              <p>
                The PATNA Initiative was founded on a documented gap and a deliberate decision to close it.
              </p>
              <p>
                Africa faces a structural contradiction. It carries over 90% of its trade by sea and bears the first economic consequences of rising shipping costs. It also holds 60% of the world's prime solar resources and the technical potential to produce the zero-emission fuels that the global shipping fleet will need by 2050.
              </p>
              <p>
                The Net-Zero Framework being finalised at the IMO could impose an estimated 20% increase in African shipping costs by 2035 on nations from a continent that contributes less than 5% of global emissions. It could also unlock a green hydrogen and green ammonia export market worth hundreds of billions of dollars — if Africa's engagement is organised, evidence-backed, and diplomatically coordinated.
              </p>
              <p>
                PATNA was established because organised engagement does not happen by default. Without a convening of expertise, African data-driven evidence, and coordinated positions, Africa's 44 IMO member states remain individually present but collectively absent from the rooms where decisions are made.
              </p>
              <p>
                Across the LEAP series, PATNA has produced the continent's first national shipping emissions inventories; convened the first Africa Strategic Maritime Summit on Shipping Decarbonisation; co-organised the Dakar Workshop that produced the 15 Dakar Declarations; contributed to Africa's first continental maritime decarbonisation strategy; and contributed — through sustained technical advocacy — to the IMO's decisions on the NZF to allow informed guidelines that reflect Africa's realities, including just transition provisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE (v3 board + secretariat) ── */}
      <section className="gov-section-v3" aria-labelledby="about-gov-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">Governance</div>
          <h2 className="v3-section-title" id="about-gov-heading">Leadership &amp; <em>Structure</em></h2>

          <div className="gov-intro-v3">
            <p>
              The PATNA Initiative is a non-profit organisation registered in Monrovia, Liberia, with a presence in Seychelles and Mauritius. The organisation operates under a governance framework that provides strategic oversight, financial accountability, and institutional stewardship. It is governed by a Board of Directors and supported by a Secretariat and a research partnership with the UCL Energy Institute.
            </p>
          </div>

          <div className="gov-subsection-title-v3">Board of Directors</div>

          <div className="board-grid-v3">
            {board.map((member) => (
              <article
                className={`board-card-v3${isChairRole(member.title) ? " chair-card" : ""}`}
                key={member.id}
              >
                <div className="board-avatar-v3">
                  {member.photo_url ? (
                    <img
                      alt={member.full_name}
                      className="board-avatar-v3-photo"
                      src={member.photo_url}
                    />
                  ) : (
                    <span className="board-avatar-v3-fallback">{getInitials(member.full_name)}</span>
                  )}
                </div>
                <div className="board-name-v3">
                  {member.full_name}
                  {member.linkedin_url && (
                    <a
                      aria-label={`${member.full_name} on LinkedIn`}
                      className="people-linkedin-badge"
                      href={member.linkedin_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      in
                    </a>
                  )}
                </div>
                <div className="board-role-v3">{member.title}</div>
                {member.organisation && <div className="board-org-v3">{member.organisation}</div>}
                {member.bio && <p className="board-bio-v3">{member.bio}</p>}
              </article>
            ))}
          </div>

          <div className="gov-subsection-title-v3" style={{ marginTop: "1rem" }}>Secretariat</div>

          <div className="secretariat-grid-v3">
            {secretariat.map((member, i) => (
              <article className="sec-card-v3" key={member.id}>
                <div
                  className="sec-avatar-v3"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {member.photo_url ? (
                    <img
                      alt={member.full_name}
                      className="sec-avatar-v3-photo"
                      src={member.photo_url}
                    />
                  ) : (
                    <span
                      className="sec-avatar-v3-fallback"
                      style={{ color: AVATAR_TEXT_COLORS[i % AVATAR_TEXT_COLORS.length] }}
                    >
                      {getInitials(member.full_name)}
                    </span>
                  )}
                </div>
                <div className="sec-info-v3">
                  <div className="sec-name-v3">
                    {member.full_name}
                    {member.linkedin_url && (
                      <a
                        aria-label={`${member.full_name} on LinkedIn`}
                        className="people-linkedin-badge"
                        href={member.linkedin_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        in
                      </a>
                    )}
                  </div>
                  <div className="sec-role-v3">{member.title}</div>
                  {member.email && (
                    <a className="sec-contact-v3" href={`mailto:${member.email}`}>
                      {member.email}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="gov-subsection-title-v3 research-title-v3">Research Leadership</div>
          <div className="research-leadership-v3">
            <p>
              The PATNA Initiative's research programme is anchored by a partnership with the UCL Energy Institute, London — one of the world's leading institutions for shipping decarbonisation research. The LEAP series was developed with UCL as the principal research partner. UCL's Shipping and Oceans Research Group provides the technical modelling, data analysis, and academic rigour that underpins PATNA's evidence outputs.
            </p>
            <div className="research-leadership-grid-v3">
              {research.map((leader) => (
                <article className="research-card-v3" key={leader.id}>
                  {leader.photo_url && (
                    <div className="research-card-avatar-v3">
                      <img alt={leader.full_name} src={leader.photo_url} />
                    </div>
                  )}
                  <h3>
                    {leader.full_name}
                    {leader.linkedin_url && (
                      <a
                        aria-label={`${leader.full_name} on LinkedIn`}
                        className="people-linkedin-badge"
                        href={leader.linkedin_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        in
                      </a>
                    )}
                  </h3>
                  <span>{leader.title}</span>
                  {leader.organisation && (
                    <span className="research-card-org-v3">{leader.organisation}</span>
                  )}
                  {leader.bio && <p>{leader.bio}</p>}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN CTA BAND ── */}
      <section className="join-band join-band-v4 about-cta-band">
        <div>
          <h2>Join the institutions shaping Africa's energy future.</h2>
          <p>
            The PATNA Initiative welcomes four kinds of engagement: funders and development partners with an interest in African maritime decarbonisation or just transition advocacy; governments and national delegations that need technical support, position preparation, or advisory capacity ahead of IMO or UNFCCC sessions; research and academic partners working on shipping decarbonisation, climate economics, or African development finance; and technical experts and practitioners ready to contribute to Africa's most active technical network on maritime governance.
          </p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/work-with-us">Work With Us →</Link>
            <Link className="cta-secondary" href="/community/join">Join the Community</Link>
          </div>
        </div>
      </section>
    </>
  );
}
