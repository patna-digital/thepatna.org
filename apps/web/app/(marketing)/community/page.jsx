import Link from "next/link";
import { canUseSupabaseAdmin, createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchActiveMemberDirectory } from "@/lib/member-profiles";

export const metadata = {
  title: "Community",
  description:
    "Discover PATNA's expert community, cohorts, and pathways for African specialists and institutions to contribute.",
};

async function getMemberSnapshot() {
  if (!canUseSupabaseAdmin()) {
    return [];
  }

  try {
    const adminClient = createSupabaseAdminClient();
    const { members } = await fetchActiveMemberDirectory({ adminClient });

    return members
      .filter((member) => member.visibility_setting !== "private")
      .slice(0, 8);
  } catch (error) {
    console.error("Unable to load public member snapshot", error);
    return [];
  }
}

function getInitials(name) {
  return String(name || "PATNA Member")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PM";
}

export default async function CommunityPage() {
  const members = await getMemberSnapshot();

  return (
    <>
      <section className="sub-page-hero" aria-label="Community">
        <div className="sub-page-hero-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=700&fit=crop&q=80"
            alt=""
          />
        </div>
        <div className="sub-page-hero-overlay" aria-hidden="true" />
        <div className="sub-page-hero-dot" aria-hidden="true" />
        <div className="sub-page-hero-inner">
          <div className="sub-page-hero-eyebrow">Expert Network</div>
          <h1 className="sub-page-hero-title">
            Africa&apos;s most connected <em>maritime climate</em> community
          </h1>
          <p className="sub-page-hero-sub">
            100+ experts, policymakers, academics, and industry practitioners collaborating
            across African member states to ensure the continent shapes global climate decisions.
          </p>
        </div>
      </section>

      <div className="feat-split-section" id="cohort-programme">
        <div className="feat-split-inner">
          <div className="feat-split-bar">
            <span className="feat-split-label">Cohort Programme</span>
            <Link className="feat-split-view-all" href="/community/join">
              Apply to join →
            </Link>
          </div>

          <div className="feat-split-grid">
            <article className="feat-main-card">
              <div className="feat-main-img">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=680&fit=crop&q=80"
                  alt="PATNA cohort members in a collaborative session"
                />
                <div className="feat-main-img-overlay" />
                <span className="feat-main-status feat-status-active">Applications Open</span>
              </div>
              <div className="feat-main-body">
                <div className="feat-main-tag">Cohort 4 · 2026 · 12-Month Programme</div>
                <h2 className="feat-main-title">
                  Cohort 4 — Climate Finance, Technology &amp; Just Transition
                </h2>
                <p className="feat-main-desc">
                  PATNA&apos;s fourth expert cohort brings together specialists in climate
                  finance instruments, clean propulsion technology, and just transition policy.
                </p>
                <div className="cohort-features">
                  <div className="cohort-feature">Full platform access and research library</div>
                  <div className="cohort-feature">Monthly expert sessions and IMO simulations</div>
                  <div className="cohort-feature">Direct engagement in PATNA evidence production</div>
                  <div className="cohort-feature">Delegation support at MEPC and UNFCCC sessions</div>
                </div>
                <div className="feat-main-footer">
                  <div className="feat-main-meta">25 members · Monthly sessions · Open disciplines</div>
                  <Link className="feat-main-cta" href="/community/join">
                    Apply for Cohort 4 →
                  </Link>
                </div>
              </div>
            </article>

            <div className="feat-side-list">
              {[
                {
                  title: "Academic & Research Network",
                  meta: "Researchers from African universities and institutes working on maritime energy transition, climate policy, and trade economics.",
                },
                {
                  title: "Policy & Government Track",
                  meta: "Ministry officials, maritime authority staff, and government advisors engaged in international climate negotiations.",
                },
                {
                  title: "Industry & Practitioners",
                  meta: "Shipowners, port operators, maritime lawyers, and professionals with a stake in Africa's maritime transition.",
                },
              ].map((track) => (
                <Link className="feat-side-item" href="/community/join" key={track.title}>
                  <div className="feat-side-content">
                    <div className="feat-side-tag">Track · Ongoing</div>
                    <div className="feat-side-title">{track.title}</div>
                    <div className="feat-side-meta">{track.meta}</div>
                  </div>
                  <span className="feat-side-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {members.length > 0 && (
        <section className="v3-members-section">
          <div className="section-narrow">
            <div className="v3-members-header">
              <div>
                <div className="v3-members-label">Network Snapshot</div>
                <h2 className="v3-members-title">
                  Meet the <em>experts</em>
                </h2>
              </div>
              <Link className="v3-members-link" href="/auth/login">
                Member directory →
              </Link>
            </div>

            <div className="v3-members-grid">
              {members.map((member) => {
                const name = member.displayNameLabel || member.displayName;
                const cohort = member.primaryCohort?.nameDisplay || member.primaryCohort?.name || "PATNA";
                return (
                  <article className="v3-member-card" key={member.id}>
                    <div className="v3-member-avatar">
                      {member.headshotSrc ? (
                        <img src={member.headshotSrc} alt={name} />
                      ) : (
                        <span className="v3-member-avatar-fallback">{getInitials(name)}</span>
                      )}
                    </div>
                    <h3 className="v3-member-name">{name}</h3>
                    <p className="v3-member-role">
                      {member.roleTitleDisplay || member.roleTitleLabel || member.organisationDisplay || "PATNA member"}
                    </p>
                    <span className="v3-member-cohort">{cohort}</span>
                    {member.countryDisplay || member.country_of_residence ? (
                      <div className="v3-member-country">
                        {member.countryDisplay || member.country_of_residence}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="join-band join-band-v4">
        <h2>Your expertise belongs in these rooms.</h2>
        <p>
          Apply to join PATNA&apos;s next cohort or become a community member. Africa&apos;s
          positions at the IMO and beyond are built by the people in this network.
        </p>
        <div className="join-band-ctas">
          <Link className="cta-primary" href="/community/join">
            Apply to Join →
          </Link>
          <Link className="cta-secondary" href="/work-with-us">
            Commission PATNA
          </Link>
        </div>
      </section>
    </>
  );
}
