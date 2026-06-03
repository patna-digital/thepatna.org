import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  storyTimeline,
  boardMembers   as staticBoardMembers,
  secretariatMembers as staticSecretariatMembers,
  partnerGroups,
} from "@/lib/patna-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    return { board, secretariat, fromDb: true };
  } catch {
    try {
      return {
        board: staticBoardMembers.map((m, i) => ({
          id: String(i), full_name: m.name, title: m.title, organisation: m.org,
          bio: m.bio, email: null, linkedin_url: null, photo_url: null,
        })),
        secretariat: staticSecretariatMembers.map((m, i) => ({
          id: String(i), full_name: m.name, title: m.title, organisation: null,
          bio: m.bio, email: m.contact, linkedin_url: null, photo_url: null,
        })),
        fromDb: false,
      };
    } catch {
      return { board: [], secretariat: [], fromDb: false };
    }
  }
}

export default async function AboutPage() {
  const [t, { board, secretariat }] = await Promise.all([
    getTranslations(),
    fetchPeopleProfiles(),
  ]);
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
          <div className="sub-page-hero-eyebrow">{t("about.heroEyebrow")}</div>
          <h1 className="sub-page-hero-title">
            {t("about.heroH1")}
          </h1>
          <p className="sub-page-hero-sub">
            {t("about.heroDesc")}
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION (v3 mist panels) ── */}
      <section className="mv-section-v3" aria-labelledby="about-mv-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">{t("about.purposeLabel")}</div>
          <h2 className="v3-section-title" id="about-mv-heading">{t("about.mvH2")}</h2>

          <div className="mv-grid-v3">
            <div className="mv-item-v3">
              <div className="mv-item-v3-label">{t("about.missionItemLabel")}</div>
              <h3 className="mv-item-v3-title">{t("about.missionItemTitle")}</h3>
              <p className="mv-item-v3-text">{t("about.missionText1")}</p>
              <p className="mv-item-v3-text">{t("about.missionText2")}</p>
            </div>
            <div className="mv-item-v3">
              <div className="mv-item-v3-label">{t("about.visionItemLabel")}</div>
              <h3 className="mv-item-v3-title">{t("about.visionItemTitle")}</h3>
              <p className="mv-item-v3-text">{t("about.visionText2")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR STORY (v3 timeline + narrative) ── */}
      <section className="story-section-v3" aria-labelledby="about-story-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">{t("about.storyLabel")}</div>
          <h2 className="v3-section-title" id="about-story-heading">
            {t("about.storyH2")}
          </h2>

          <div className="story-grid-v3">
            {/* Timeline — titles/bodies come from patna-data static content */}
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
              <p>{t("about.storyNarrative1")}</p>
              <p>{t("about.storyNarrative2")}</p>
              <p>{t("about.storyNarrative3")}</p>
              <p>{t("about.storyNarrative4")}</p>
              <p>{t("about.storyNarrative5")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOVERNANCE (v3 board + secretariat) ── */}
      <section className="gov-section-v3" aria-labelledby="about-gov-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">{t("about.govLabel")}</div>
          <h2 className="v3-section-title" id="about-gov-heading">{t("about.govH2")}</h2>

          <div className="gov-intro-v3">
            <p>{t("about.govIntro")}</p>
          </div>

          <div className="gov-subsection-title-v3">{t("about.govBoard")}</div>

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

          <div className="gov-subsection-title-v3" style={{ marginTop: "1rem" }}>{t("about.govSecretariat")}</div>

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

      {/* ── PARTNERS ── */}
      <section className="partners-section-v3" aria-labelledby="about-partners-heading">
        <div className="section-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5rem" }}>
          <div className="v3-section-label">{t("about.partnersLabel")}</div>
          <h2 className="v3-section-title" id="about-partners-heading">{t("about.partnersH2")}</h2>
          <p className="gov-intro-v3" style={{ marginBottom: "2.5rem" }}>
            {t("about.partnersDesc")}
          </p>

          {partnerGroups.map((group) => (
            <div className="partner-group-v3" key={group.title}>
              <div className="partner-group-title-v3">{group.title}</div>
              <div className="partner-cards-grid-v3">
                {group.partners.map((partner) => (
                  <article className="partner-card-v3" key={partner.abbr}>
                    <div className="partner-card-logo-v3" aria-hidden="true">
                      <span>{partner.abbr}</span>
                    </div>
                    <div className="partner-card-name-v3">{partner.name}</div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOIN CTA BAND ── */}
      <section className="join-band join-band-v4 about-cta-band">
        <div>
          <h2>{t("about.ctaTitle")}</h2>
          <p>{t("about.ctaDesc")}</p>
          <div className="join-band-ctas">
            <Link className="cta-primary" href="/work-with-us">{t("about.ctaPrimary")}</Link>
            <Link className="cta-secondary" href="/community/join">{t("about.ctaSecondary")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
