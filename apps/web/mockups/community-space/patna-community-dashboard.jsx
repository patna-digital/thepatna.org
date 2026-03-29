import { useState } from "react";

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard" },
  { icon: "◎", label: "My Spaces", badge: 3 },
  { icon: "✦", label: "Discussions", badge: 7 },
  { icon: "⊡", label: "Insights" },
  { icon: "◈", label: "Members" },
  { icon: "◷", label: "Events" },
  { icon: "◻", label: "Applications", badge: 4, highlight: true },
  { icon: "◇", label: "Work With Us" },
  { icon: "⚙", label: "Settings" },
];

const SPACES = [
  { name: "Policy Cohort", type: "Cohort Space", members: 34, threads: 12, unread: 3, role: "Lead", color: "#03529d" },
  { name: "SIDS Coalition", type: "Constituency", members: 18, threads: 5, unread: 1, role: "Member", color: "#0a6bbf" },
  { name: "IMO Strategy WG", type: "Working Group", members: 11, threads: 8, unread: 0, role: "Member", color: "#1484d8" },
  { name: "LDC Energy Taskforce", type: "Working Group", members: 9, threads: 3, unread: 2, role: "Member", color: "#2496e8" },
];

const APPLICATIONS = [
  { name: "Fatou Ndiaye", country: "Senegal", org: "Ministry of Environment", status: "interviewing", cohort: "Policy" },
  { name: "Kwame Asante", country: "Ghana", org: "GMA", status: "submitted", cohort: "Policy" },
  { name: "Priya Reddy", country: "South Africa", org: "UCT Energy Institute", status: "submitted", cohort: "Academic" },
  { name: "Moussa Camara", country: "Guinea", org: "ONAP", status: "interviewing", cohort: "Policy" },
];

const DISCUSSIONS = [
  { space: "Policy Cohort", title: "Feedback on IMO MEPC 83 Draft Outcomes", author: "C. Okonkwo", time: "2h ago", replies: 6, unread: true },
  { space: "SIDS Coalition", title: "Pacific alignment on GHG levy — coordinating positions", author: "T. Ravuiwasa", time: "5h ago", replies: 3, unread: true },
  { space: "IMO Strategy WG", title: "African co-sponsorship template for upcoming session", author: "You", time: "1d ago", replies: 11, unread: false },
  { space: "Policy Cohort", title: "Upcoming consultation: COP30 prep brief", author: "A. Mwangi", time: "2d ago", replies: 4, unread: false },
];

const INSIGHTS = [
  { type: "BRIEF", title: "African Positions on IMO Net-Zero Framework", date: "Feb 2025", cohort: "Policy" },
  { type: "REPORT", title: "LEAP Phase II — Interim Findings", date: "Jan 2025", cohort: "All" },
  { type: "BLOG", title: "Why SIDS Need a Stronger Voice in Shipping Decarbonisation", date: "Mar 2025", cohort: "Policy" },
];

const EVENTS_DATA = [
  // ── UPCOMING ──
  {
    id: "e1", status: "upcoming",
    title: "Policy Cohort Monthly Sync",
    date: "14 Mar 2026", dateShort: "Mar 14", endDate: null,
    type: "Internal", location: "Virtual", platform: "Zoom",
    description: "Monthly coordination call for the Policy Cohort. Agenda covers IMO MEPC 83 debrief, COP30 prep, and onboarding updates for new members.",
    attendees: 18, capacity: 30, rsvpd: true,
    tags: ["Policy", "IMO", "COP30"],
    organiser: "Dr. Amara Diallo",
    outputs: [],
  },
  {
    id: "e2", status: "upcoming",
    title: "IMO MEPC 83",
    date: "24 Mar 2026", dateShort: "Mar 24–28", endDate: "28 Mar 2026",
    type: "International", location: "London, UK", platform: null,
    description: "The 83rd session of IMO's Marine Environment Protection Committee. PATNA members are supporting African delegations with technical briefings and coordination meetings on the margins.",
    attendees: 6, capacity: null, rsvpd: false,
    tags: ["IMO", "MEPC", "Policy", "Shipping"],
    organiser: "IMO Secretariat",
    outputs: [],
  },
  {
    id: "e3", status: "upcoming",
    title: "Dakar Maritime Decarbonisation Prep Workshop",
    date: "3 Apr 2026", dateShort: "Apr 3", endDate: null,
    type: "PATNA Event", location: "Virtual", platform: "Teams",
    description: "Preparatory session for the Dakar workshop series. Brings together PATNA members and regional partners to align on thematic priorities and session structure ahead of the in-person event.",
    attendees: 22, capacity: 40, rsvpd: true,
    tags: ["Maritime", "West Africa", "Decarbonisation"],
    organiser: "PATNA Secretariat",
    outputs: [],
  },
  {
    id: "e4", status: "upcoming",
    title: "LDC Energy Access Roundtable",
    date: "17 Apr 2026", dateShort: "Apr 17", endDate: null,
    type: "PATNA Event", location: "Nairobi, Kenya", platform: null,
    description: "A focused roundtable convening LDC representatives, energy economists, and development finance experts to explore just transition pathways and financing gaps for least developed countries.",
    attendees: 14, capacity: 25, rsvpd: false,
    tags: ["LDCs", "Energy Access", "Finance", "Just Transition"],
    organiser: "PATNA Secretariat",
    outputs: [],
  },
  {
    id: "e5", status: "upcoming",
    title: "SB62 — UNFCCC Subsidiary Bodies",
    date: "5 Jun 2026", dateShort: "Jun 5–15", endDate: "15 Jun 2026",
    type: "International", location: "Bonn, Germany", platform: null,
    description: "PATNA members will be attending the 62nd sessions of the UNFCCC Subsidiary Body for Scientific and Technological Advice (SBSTA) and Subsidiary Body for Implementation (SBI).",
    attendees: 4, capacity: null, rsvpd: false,
    tags: ["UNFCCC", "Climate", "COP30 Prep"],
    organiser: "UNFCCC Secretariat",
    outputs: [],
  },
  // ── PAST ──
  {
    id: "e6", status: "past",
    title: "African Strategic Summit on Shipping Decarbonisation",
    date: "12 Mar 2025", dateShort: "Mar 2025", endDate: "14 Mar 2025",
    type: "PATNA Event", location: "Abuja, Nigeria", platform: null,
    description: "The summit brought together African policymakers, negotiators, and industry leaders to build a shared understanding and a more coordinated continental position on shipping decarbonisation within wider energy transition efforts.",
    attendees: 87, capacity: null, rsvpd: true,
    tags: ["Shipping", "Policy", "Strategy", "Nigeria"],
    organiser: "PATNA Secretariat",
    outputs: [
      { type: "REPORT", title: "Summit Communiqué — African Position on IMO GHG Strategy" },
      { type: "BRIEF", title: "Key Negotiating Asks for African States" },
    ],
  },
  {
    id: "e7", status: "past",
    title: "Dakar Maritime Decarbonisation Workshop",
    date: "19 Aug 2025", dateShort: "Aug 2025", endDate: "21 Aug 2025",
    type: "PATNA Event", location: "Dakar, Senegal", platform: null,
    description: "Over three days, more than 100 delegates from 25 African IMO Member States, regional bodies, industry, and partners explored practical pathways for implementation and cooperation on maritime decarbonisation.",
    attendees: 104, capacity: null, rsvpd: false,
    tags: ["Maritime", "West Africa", "Decarbonisation", "Senegal"],
    organiser: "PATNA Secretariat",
    outputs: [
      { type: "REPORT", title: "Workshop Proceedings & Technical Findings" },
      { type: "BLOG", title: "Reflections from Dakar: What African States Need" },
    ],
  },
  {
    id: "e8", status: "past",
    title: "Policy Cohort Quarterly Review — Q4 2025",
    date: "15 Nov 2025", dateShort: "Nov 2025", endDate: null,
    type: "Internal", location: "Virtual", platform: "Zoom",
    description: "End-of-year review for the Policy Cohort covering strategic priorities, member contributions, and planning for Q1 2026. Included updates from LEAP Phase II leads.",
    attendees: 21, capacity: null, rsvpd: true,
    tags: ["Policy", "LEAP", "Annual Review"],
    organiser: "Dr. Amara Diallo",
    outputs: [
      { type: "BRIEF", title: "Q4 2025 Cohort Update & 2026 Priorities" },
    ],
  },
  {
    id: "e9", status: "past",
    title: "IMO MEPC 82",
    date: "30 Sep 2025", dateShort: "Sep 2025", endDate: "4 Oct 2025",
    type: "International", location: "London, UK", platform: null,
    description: "PATNA provided technical support to seven African delegations attending MEPC 82, including pre-session briefings, co-sponsorship coordination, and post-session debriefs.",
    attendees: 7, capacity: null, rsvpd: false,
    tags: ["IMO", "MEPC", "Policy", "Shipping"],
    organiser: "IMO Secretariat",
    outputs: [
      { type: "BRIEF", title: "MEPC 82 Outcomes: What It Means for Africa" },
    ],
  },
];

const MEMBERS = [
  {
    id: 1, initials: "AD", name: "Dr. Amara Diallo", role: "Policy Adviser", country: "Senegal", org: "DEEC Senegal",
    cohorts: ["Policy"], primaryCohort: "Policy", isLead: true,
    tags: ["IMO Negotiations", "SIDS", "Maritime Law", "COP"],
    spaces: ["Policy Cohort", "SIDS Coalition", "IMO Strategy WG"],
    bio: "Senior policy adviser specialising in African participation in international maritime and climate frameworks.",
    contactEnabled: true, isMe: true,
  },
  {
    id: 2, initials: "CO", name: "Chidi Okonkwo", role: "Policy Researcher", country: "Nigeria", org: "NIMASA",
    cohorts: ["Policy", "Industry"], primaryCohort: "Policy",
    tags: ["Shipping Decarbonisation", "Oil-producing States", "GHG Levy"],
    spaces: ["Policy Cohort", "IMO Strategy WG", "LDC Energy Taskforce"],
    bio: "Research lead on Nigeria's position in IMO climate negotiations, with a focus on GHG pricing mechanisms.",
    contactEnabled: true,
  },
  {
    id: 3, initials: "AM", name: "Aisha Mwangi", role: "Climate Policy Analyst", country: "Kenya", org: "KMA",
    cohorts: ["Policy"], primaryCohort: "Policy",
    tags: ["COP", "NDCs", "East Africa", "Energy Transition"],
    spaces: ["Policy Cohort", "SIDS Coalition"],
    bio: "Climate policy analyst tracking the intersection of national NDCs and maritime sector obligations.",
    contactEnabled: false,
  },
  {
    id: 4, initials: "TR", name: "Taniela Ravuiwasa", role: "Maritime Policy Officer", country: "Fiji", org: "Pacific SIDS Group",
    cohorts: ["Policy", "Civil Society"], primaryCohort: "Policy",
    tags: ["SIDS", "Pacific", "Loss & Damage", "IMO"],
    spaces: ["Policy Cohort", "SIDS Coalition"],
    bio: "Representing Pacific SIDS in climate and maritime negotiations, with expertise in loss and damage frameworks.",
    contactEnabled: true,
  },
  {
    id: 5, initials: "NK", name: "Dr. Nadia Koné", role: "Energy Economist", country: "Côte d'Ivoire", org: "ANARE-CI",
    cohorts: ["Academic", "Policy"], primaryCohort: "Academic",
    tags: ["Energy Economics", "LDCs", "Just Transition", "Finance"],
    spaces: ["Policy Cohort", "LDC Energy Taskforce"],
    bio: "Energy economist researching just transition finance pathways for LDCs and emerging African economies.",
    contactEnabled: true,
  },
  {
    id: 6, initials: "BM", name: "Bright Mensah", role: "Shipping Industry Adviser", country: "Ghana", org: "Ghana Ports Authority",
    cohorts: ["Industry", "Policy"], primaryCohort: "Industry",
    tags: ["Port Decarbonisation", "West Africa", "Green Fuels"],
    spaces: ["Policy Cohort", "IMO Strategy WG"],
    bio: "Industry adviser on port-level decarbonisation strategies across West African coastal states.",
    contactEnabled: true,
  },
  {
    id: 7, initials: "SO", name: "Seun Ojo", role: "Civil Society Lead", country: "Nigeria", org: "Climate Justice Africa",
    cohorts: ["Civil Society"], primaryCohort: "Civil Society",
    tags: ["Climate Justice", "Community Engagement", "Advocacy"],
    spaces: ["SIDS Coalition", "LDC Energy Taskforce"],
    bio: "Leads civil society advocacy on climate justice within African regional bodies and international processes.",
    contactEnabled: false,
  },
  {
    id: 8, initials: "RM", name: "Rokia Maïga", role: "Legal Adviser", country: "Mali", org: "Ministry of Transport",
    cohorts: ["Policy"], primaryCohort: "Policy",
    tags: ["Maritime Law", "LDCs", "Francophone Africa", "MARPOL"],
    spaces: ["Policy Cohort"],
    bio: "Legal adviser specialising in MARPOL compliance and treaty obligations for landlocked developing states.",
    contactEnabled: true,
  },
];

const COHORT_FILTERS = ["All Cohorts", "Policy", "Academic", "Industry", "Civil Society"];
const TAG_FILTERS = ["All Tags", "SIDS", "LDCs", "IMO", "COP", "Maritime Law", "Energy Transition", "Climate Justice", "Green Fuels"];
const COUNTRY_FILTERS = ["All Countries", "Nigeria", "Kenya", "Senegal", "Ghana", "Côte d'Ivoire", "Fiji", "Mali"];

const COHORT_COLORS = { Policy: "#03529d", Academic: "#1a7a40", Industry: "#b07500", "Civil Society": "#7a1a6e" };

function Badge({ count, highlight }) {
  return (
    <span style={{
      background: highlight ? "#e8400c" : "#b9e8fa",
      color: highlight ? "#fff" : "#03529d",
      fontSize: "10px", fontWeight: 700,
      padding: "2px 6px", borderRadius: "10px",
      letterSpacing: "0.02em", minWidth: 18, textAlign: "center",
    }}>{count}</span>
  );
}

function StatusPill({ status }) {
  const map = {
    interviewing: { bg: "#fff8e6", color: "#b07500", label: "Interviewing" },
    submitted: { bg: "#eef6ff", color: "#03529d", label: "Submitted" },
    approved: { bg: "#e8faf0", color: "#1a7a40", label: "Approved" },
  };
  const s = map[status] || map.submitted;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
}

function MemberModal({ member, onClose }) {
  if (!member) return null;
  const primaryColor = COHORT_COLORS[member.primaryCohort] || "#03529d";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,82,157,0.2)", backdropFilter: "blur(3px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 480, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(3,82,157,0.22)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #1484d8 100%)`, padding: "24px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, padding: "4px 10px", cursor: "pointer" }}>✕</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(185,232,250,0.25)", border: "2px solid rgba(185,232,250,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#b9e8fa", flexShrink: 0 }}>{member.initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                {member.name}
                {member.isLead && <span style={{ fontSize: 9, background: "#b9e8fa", color: "#03529d", padding: "2px 7px", borderRadius: 4, fontWeight: 800, letterSpacing: "0.06em" }}>COHORT LEAD</span>}
              </div>
              <div style={{ fontSize: 12, color: "rgba(185,232,250,0.9)", marginTop: 3 }}>{member.role} · {member.org}</div>
              <div style={{ fontSize: 11, color: "rgba(185,232,250,0.7)", marginTop: 2 }}>{member.country}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>About</div>
            <p style={{ margin: 0, fontSize: 13, color: "#3a5068", lineHeight: 1.6 }}>{member.bio}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Cohorts</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {member.cohorts.map(c => (
                <span key={c} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 700, background: `${COHORT_COLORS[c] || "#03529d"}18`, color: COHORT_COLORS[c] || "#03529d", border: c === member.primaryCohort ? `1.5px solid ${COHORT_COLORS[c]}44` : "1.5px solid transparent" }}>
                  {c}{c === member.primaryCohort ? " (primary)" : ""}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Expertise</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {member.tags.map(t => <span key={t} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#f0f5fa", color: "#3a5068", fontWeight: 500 }}>{t}</span>)}
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Shared Spaces</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {member.spaces.map(s => <span key={s} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#eef6ff", color: "#03529d", fontWeight: 600 }}>{s}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {member.contactEnabled && !member.isMe && (
              <button style={{ flex: 1, background: "#03529d", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>✉ Send Message</button>
            )}
            {!member.contactEnabled && !member.isMe && (
              <div style={{ flex: 1, background: "#f0f5fa", borderRadius: 8, padding: "10px", fontSize: 12, color: "#8aadcc", textAlign: "center" }}>Contact disabled by member</div>
            )}
            {member.isMe && (
              <button style={{ flex: 1, background: "#03529d", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Edit My Profile</button>
            )}
            <button onClick={onClose} style={{ background: "#f0f5fa", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#6b8db5", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, onClick }) {
  const primaryColor = COHORT_COLORS[member.primaryCohort] || "#03529d";
  return (
    <div
      onClick={() => onClick(member)}
      style={{ background: "#fff", borderRadius: 12, padding: "18px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)", cursor: "pointer", borderTop: `3px solid ${primaryColor}`, position: "relative", transition: "box-shadow 0.15s, transform 0.1s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(3,82,157,0.14)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(3,82,157,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {member.isMe && <span style={{ position: "absolute", top: 12, right: 12, fontSize: 9, background: "#eef6ff", color: "#03529d", padding: "2px 7px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.07em" }}>YOU</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: `${primaryColor}18`, border: `2px solid ${primaryColor}33`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: primaryColor }}>{member.initials}</div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a2940", display: "flex", alignItems: "center", gap: 6 }}>
            {member.name}
            {member.isLead && <span style={{ fontSize: 8, background: primaryColor, color: "#fff", padding: "2px 5px", borderRadius: 3, letterSpacing: "0.07em", fontWeight: 700 }}>LEAD</span>}
          </div>
          <div style={{ fontSize: 11, color: "#6b8db5", marginTop: 1 }}>{member.role}</div>
          <div style={{ fontSize: 10, color: "#8aadcc" }}>{member.org} · {member.country}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {member.cohorts.map(c => <span key={c} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: `${COHORT_COLORS[c] || "#03529d"}18`, color: COHORT_COLORS[c] || "#03529d" }}>{c}</span>)}
        {member.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#f0f5fa", color: "#6b8db5" }}>{t}</span>)}
        {member.tags.length > 2 && <span style={{ fontSize: 9, color: "#8aadcc" }}>+{member.tags.length - 2}</span>}
      </div>
      <div style={{ fontSize: 11, color: "#6b8db5", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{member.bio}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#8aadcc" }}>{member.spaces.length} space{member.spaces.length !== 1 ? "s" : ""}</span>
        {member.contactEnabled && !member.isMe && <button onClick={e => e.stopPropagation()} style={{ fontSize: 10, background: "#eef6ff", border: "none", borderRadius: 6, padding: "5px 10px", color: "#03529d", fontWeight: 600, cursor: "pointer" }}>Contact</button>}
        {!member.contactEnabled && !member.isMe && <span style={{ fontSize: 10, color: "#c0d4e8" }}>Contact off</span>}
        {member.isMe && <button onClick={e => e.stopPropagation()} style={{ fontSize: 10, background: "#f0f5fa", border: "none", borderRadius: 6, padding: "5px 10px", color: "#6b8db5", fontWeight: 600, cursor: "pointer" }}>Edit Profile</button>}
      </div>
    </div>
  );
}

function MembersView({ onNavTo }) {
  const [search, setSearch] = useState("");
  const [cohortFilter, setCohortFilter] = useState("All Cohorts");
  const [tagFilter, setTagFilter] = useState("All Tags");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [selectedMember, setSelectedMember] = useState(null);

  const filtered = MEMBERS.filter(m => {
    const s = search.toLowerCase();
    const matchSearch = !s || m.name.toLowerCase().includes(s) || m.org.toLowerCase().includes(s) || m.tags.some(t => t.toLowerCase().includes(s));
    const matchCohort = cohortFilter === "All Cohorts" || m.cohorts.includes(cohortFilter);
    const matchTag = tagFilter === "All Tags" || m.tags.includes(tagFilter);
    const matchCountry = countryFilter === "All Countries" || m.country === countryFilter;
    return matchSearch && matchCohort && matchTag && matchCountry;
  });

  const sel = (val, setter, opts) => (
    <select value={val} onChange={e => setter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #d0e4f5", background: "#fff", fontSize: 12, color: "#1a2940", fontWeight: 500, cursor: "pointer", outline: "none" }}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <div>
      {selectedMember && <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b8db5", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Community</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#03529d", letterSpacing: "-0.3px" }}>Member Directory</h1>
          <p style={{ margin: "4px 0 0", color: "#6b8db5", fontSize: 13 }}>{MEMBERS.length} members across 4 cohorts · visible to members only</p>
        </div>
        <div style={{ fontSize: 11, background: "#eef6ff", color: "#03529d", border: "1.5px solid #c8dff5", borderRadius: 8, padding: "8px 14px", fontWeight: 600 }}>🔒 Members only</div>
      </div>

      {/* Cohort pills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { cohort: "Policy", count: 6, color: "#03529d" },
          { cohort: "Academic", count: 2, color: "#1a7a40" },
          { cohort: "Industry", count: 2, color: "#b07500" },
          { cohort: "Civil Society", count: 2, color: "#7a1a6e" },
        ].map(({ cohort, count, color }) => (
          <button key={cohort} onClick={() => setCohortFilter(cohortFilter === cohort ? "All Cohorts" : cohort)} style={{ background: cohortFilter === cohort ? color : "#fff", border: `1.5px solid ${color}44`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", textAlign: "left", boxShadow: "0 1px 4px rgba(3,82,157,0.06)", transition: "all 0.15s" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: cohortFilter === cohort ? "#fff" : color }}>{count}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: cohortFilter === cohort ? "rgba(255,255,255,0.9)" : color, marginTop: 2 }}>{cohort}</div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)", display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#8aadcc" }}>⊡</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, org, or expertise…" style={{ width: "100%", padding: "8px 12px 8px 28px", borderRadius: 8, border: "1.5px solid #d0e4f5", fontSize: 12, color: "#1a2940", outline: "none", boxSizing: "border-box" }} />
        </div>
        {sel(cohortFilter, setCohortFilter, COHORT_FILTERS)}
        {sel(tagFilter, setTagFilter, TAG_FILTERS)}
        {sel(countryFilter, setCountryFilter, COUNTRY_FILTERS)}
        {(search || cohortFilter !== "All Cohorts" || tagFilter !== "All Tags" || countryFilter !== "All Countries") && (
          <button onClick={() => { setSearch(""); setCohortFilter("All Cohorts"); setTagFilter("All Tags"); setCountryFilter("All Countries"); }} style={{ fontSize: 11, background: "#f0f5fa", border: "none", borderRadius: 6, padding: "8px 12px", color: "#6b8db5", fontWeight: 600, cursor: "pointer" }}>Clear</button>
        )}
        <span style={{ fontSize: 11, color: "#8aadcc", marginLeft: "auto" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
          {filtered.map(m => <MemberCard key={m.id} member={m} onClick={setSelectedMember} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#8aadcc" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#6b8db5" }}>No members match your filters</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or filter criteria</div>
        </div>
      )}
    </div>
  );
}

function EventModal({ event, onClose }) {
  if (!event) return null;
  const typeColor = { Internal: "#03529d", "PATNA Event": "#1a7a40", International: "#b07500" };
  const typeBg   = { Internal: "#eef6ff",  "PATNA Event": "#edfaf3",  International: "#fff8e6" };
  const outputIcon = { REPORT: "📄", BRIEF: "📋", BLOG: "✍️" };
  const color = typeColor[event.type] || "#03529d";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,82,157,0.2)", backdropFilter: "blur(3px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 540, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(3,82,157,0.2)" }}>
        {/* Header band */}
        <div style={{ background: `linear-gradient(135deg, ${color} 0%, #1484d8 100%)`, padding: "22px 24px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, color: "#fff", fontSize: 14, padding: "4px 10px", cursor: "pointer" }}>✕</button>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{event.type}</span>
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>{event.status === "upcoming" ? "Upcoming" : "Past Event"}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>{event.title}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(185,232,250,0.9)", flexWrap: "wrap" }}>
            <span>📅 {event.endDate ? `${event.date} – ${event.endDate}` : event.date}</span>
            <span>📍 {event.location}{event.platform ? ` · ${event.platform}` : ""}</span>
            <span>👥 {event.attendees} {event.status === "upcoming" ? "registered" : "attended"}</span>
          </div>
        </div>

        <div style={{ padding: "22px 24px" }}>
          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {event.tags.map(t => <span key={t} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "#f0f5fa", color: "#3a5068", fontWeight: 500 }}>{t}</span>)}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>About this event</div>
            <p style={{ margin: 0, fontSize: 13, color: "#3a5068", lineHeight: 1.7 }}>{event.description}</p>
          </div>

          {/* Organiser */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Organiser</div>
            <div style={{ fontSize: 13, color: "#1a2940", fontWeight: 600 }}>{event.organiser}</div>
          </div>

          {/* Outputs (past events only) */}
          {event.outputs.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Event Outputs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {event.outputs.map((o, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0f5fa", borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>
                    <span style={{ fontSize: 16 }}>{outputIcon[o.type] || "📄"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2940" }}>{o.title}</div>
                      <div style={{ fontSize: 10, color: "#8aadcc", marginTop: 2 }}>{o.type} · Insights Hub</div>
                    </div>
                    <span style={{ fontSize: 11, color: "#03529d", fontWeight: 600 }}>View →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capacity bar (upcoming only) */}
          {event.status === "upcoming" && event.capacity && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b8db5", marginBottom: 6 }}>
                <span>Registration</span>
                <span style={{ fontWeight: 600 }}>{event.attendees} / {event.capacity}</span>
              </div>
              <div style={{ background: "#e4eff9", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${Math.round((event.attendees / event.capacity) * 100)}%`, background: "#03529d", height: "100%", borderRadius: 4 }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {event.status === "upcoming" && (
              event.rsvpd
                ? <div style={{ flex: 1, background: "#edfaf3", border: "1.5px solid #b3e8ce", borderRadius: 8, padding: "10px", fontSize: 13, color: "#1a7a40", fontWeight: 600, textAlign: "center" }}>✓ You're registered</div>
                : <button style={{ flex: 1, background: "#03529d", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Register for this event</button>
            )}
            {event.status === "past" && (
              <button style={{ flex: 1, background: "#03529d", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>View Event Summary</button>
            )}
            <button onClick={onClose} style={{ background: "#f0f5fa", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#6b8db5", cursor: "pointer" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsView() {
  const [tab, setTab] = useState("upcoming");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const typeColors = { Internal: "#03529d", "PATNA Event": "#1a7a40", International: "#b07500" };
  const typeBgs    = { Internal: "#eef6ff",  "PATNA Event": "#edfaf3", International: "#fff8e6" };

  const filtered = EVENTS_DATA.filter(e => {
    const matchTab  = e.status === tab;
    const matchType = typeFilter === "All" || e.type === typeFilter;
    return matchTab && matchType;
  });

  const upcoming = EVENTS_DATA.filter(e => e.status === "upcoming");
  const past     = EVENTS_DATA.filter(e => e.status === "past");
  const myRsvps  = upcoming.filter(e => e.rsvpd).length;

  return (
    <div>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b8db5", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Calendar</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#03529d", letterSpacing: "-0.3px" }}>Events</h1>
          <p style={{ margin: "4px 0 0", color: "#6b8db5", fontSize: 13 }}>
            Workshops, summits, and coordination meetings — upcoming and past
          </p>
        </div>
        <button style={{ background: "#03529d", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
          + Submit an Event
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Upcoming Events",    value: upcoming.length, icon: "◷", accent: "#03529d" },
          { label: "My RSVPs",           value: myRsvps,         icon: "✓", accent: "#1a7a40" },
          { label: "Past This Year",     value: past.length,     icon: "⊡", accent: "#6b8db5" },
          { label: "PATNA-Organised",    value: EVENTS_DATA.filter(e => e.type === "PATNA Event").length, icon: "◈", accent: "#b07500" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)", borderTop: `3px solid ${s.accent}` }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.accent, letterSpacing: "-0.5px" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b8db5", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + type filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        {/* Tab pills */}
        <div style={{ display: "flex", background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(3,82,157,0.07)", gap: 2 }}>
          {["upcoming", "past"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 20px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600,
              cursor: "pointer", textTransform: "capitalize",
              background: tab === t ? "#03529d" : "transparent",
              color: tab === t ? "#fff" : "#6b8db5",
              transition: "all 0.15s",
            }}>{t === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}</button>
          ))}
        </div>

        {/* Type filter chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Internal", "PATNA Event", "International"].map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 11, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: typeFilter === type
                ? (typeColors[type] || "#03529d")
                : "#fff",
              color: typeFilter === type
                ? "#fff"
                : (typeColors[type] || "#6b8db5"),
              boxShadow: "0 1px 4px rgba(3,82,157,0.07)",
            }}>{type}</button>
          ))}
        </div>
      </div>

      {/* Events list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#8aadcc" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◷</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#6b8db5" }}>No events match your filters</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(event => {
            const color = typeColors[event.type] || "#03529d";
            const bg    = typeBgs[event.type]    || "#eef6ff";
            return (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{
                  background: "#fff", borderRadius: 12,
                  boxShadow: "0 1px 4px rgba(3,82,157,0.07)",
                  cursor: "pointer", overflow: "hidden",
                  display: "flex", transition: "box-shadow 0.15s, transform 0.1s",
                  borderLeft: `4px solid ${color}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(3,82,157,0.13)"; e.currentTarget.style.transform = "translateX(2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(3,82,157,0.07)"; e.currentTarget.style.transform = "translateX(0)"; }}
              >
                {/* Date block */}
                <div style={{ background: bg, padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 80, flexShrink: 0, borderRight: `1px solid ${color}22` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {event.dateShort.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1, marginTop: 2 }}>
                    {event.dateShort.split(" ")[1] || ""}
                  </div>
                </div>

                {/* Main content */}
                <div style={{ padding: "16px 20px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, background: bg, color, padding: "2px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.05em" }}>{event.type}</span>
                        {event.rsvpd && event.status === "upcoming" && (
                          <span style={{ fontSize: 10, background: "#edfaf3", color: "#1a7a40", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>✓ Registered</span>
                        )}
                        {event.outputs.length > 0 && (
                          <span style={{ fontSize: 10, background: "#f0f5fa", color: "#6b8db5", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{event.outputs.length} output{event.outputs.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2940", marginBottom: 4 }}>{event.title}</div>
                      <div style={{ fontSize: 12, color: "#6b8db5", display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span>📅 {event.endDate ? `${event.date} – ${event.endDate}` : event.date}</span>
                        <span>📍 {event.location}{event.platform ? ` · ${event.platform}` : ""}</span>
                        <span>👥 {event.attendees} {event.status === "upcoming" ? "registered" : "attended"}</span>
                      </div>
                    </div>

                    {/* Right side action */}
                    <div style={{ flexShrink: 0 }}>
                      {event.status === "upcoming" && !event.rsvpd && (
                        <button
                          onClick={e => { e.stopPropagation(); }}
                          style={{ background: "#03529d", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}
                        >RSVP</button>
                      )}
                      {event.status === "past" && (
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedEvent(event); }}
                          style={{ background: "#f0f5fa", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 11, fontWeight: 600, color: "#03529d", cursor: "pointer", whiteSpace: "nowrap" }}
                        >View outputs</button>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: "#6b8db5", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {event.description}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                    {event.tags.map(t => (
                      <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "#f0f5fa", color: "#6b8db5", fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  { icon: "📋", text: "Summarise recent Policy Cohort discussions" },
  { icon: "📅", text: "What events do I have coming up?" },
  { icon: "📄", text: "Find Insights on IMO GHG strategy" },
  { icon: "👥", text: "Who in my cohort works on SIDS issues?" },
  { icon: "📬", text: "Show me applications awaiting my review" },
  { icon: "🗺️", text: "What is PATNA's position on the GHG levy?" },
];

const SAMPLE_MESSAGES = [
  {
    role: "assistant",
    text: "Hello, Amara. I'm PATNA Assistant — I have access to community discussions, member profiles, events, insights, and working group activity that you're permitted to view.\n\nWhat would you like to explore today?",
    time: "now",
  },
];

const ACCESS_SCOPES = [
  { label: "Policy Cohort", detail: "Discussions, members, documents", granted: true },
  { label: "SIDS Coalition", detail: "Discussions, members", granted: true },
  { label: "IMO Strategy WG", detail: "Discussions, members", granted: true },
  { label: "LDC Energy Taskforce", detail: "Discussions, members", granted: true },
  { label: "Insights Hub", detail: "All published content", granted: true },
  { label: "Events & Calendar", detail: "All community events", granted: true },
  { label: "Member Directory", detail: "Profiles (visibility-gated)", granted: true },
  { label: "Admin / Applications", detail: "Policy Cohort only — read", granted: true },
  { label: "Other Cohort Spaces", detail: "Not a member", granted: false },
  { label: "Financial / HR records", detail: "Restricted — Admin only", granted: false },
];

function AIChatPanel({ open, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [showAccess, setShowAccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input.trim(), time: "now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "This feature is coming soon. In the live version, I'll search across your permitted spaces, insights, and member data to answer this — respecting your access level as Policy Cohort Lead.",
        time: "now",
      }]);
    }, 1400);
  };

  const handlePrompt = (text) => {
    setInput(text);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop — subtle, doesn't block interaction behind */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 290, background: "transparent" }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        bottom: 84,
        right: 28,
        width: 400,
        maxWidth: "calc(100vw - 40px)",
        height: 580,
        maxHeight: "calc(100vh - 110px)",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 24px 64px rgba(3,82,157,0.22), 0 4px 16px rgba(3,82,157,0.12)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #d0e4f5",
        animation: "slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes blink {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40%            { opacity: 1;   transform: scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #03529d 0%, #0a6bbf 100%)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(185,232,250,0.25)", border: "2px solid rgba(185,232,250,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>PATNA Assistant</div>
            <div style={{ color: "rgba(185,232,250,0.8)", fontSize: 10, marginTop: 1 }}>Context-aware · Access-restricted</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowAccess(!showAccess)}
              title="View my data access"
              style={{ background: showAccess ? "rgba(185,232,250,0.35)" : "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, padding: "5px 9px", color: "rgba(185,232,250,0.9)", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: "0.03em" }}
            >🔒 Access</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, padding: "5px 9px", color: "rgba(255,255,255,0.8)", fontSize: 14, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* Access scope panel (toggled) */}
        {showAccess && (
          <div style={{ background: "#f7fafd", borderBottom: "1px solid #d0e4f5", padding: "14px 18px", overflowY: "auto", maxHeight: 220 }}>
            <div style={{ fontSize: 10, color: "#6b8db5", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10 }}>
              Your data access for this session
            </div>
            {ACCESS_SCOPES.map((scope, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8, marginBottom: 8, borderBottom: i < ACCESS_SCOPES.length - 1 ? "1px solid #e4eff9" : "none" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{scope.granted ? "✅" : "🚫"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: scope.granted ? "#1a2940" : "#aab8c8" }}>{scope.label}</div>
                  <div style={{ fontSize: 10, color: "#8aadcc" }}>{scope.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #03529d, #1484d8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0, marginTop: 2 }}>✦</div>
                  <div style={{ background: "#f0f5fa", borderRadius: "4px 14px 14px 14px", padding: "10px 14px", maxWidth: "80%", fontSize: 13, color: "#1a2940", lineHeight: 1.6, whiteSpace: "pre-line" }}>{msg.text}</div>
                </div>
              )}
              {msg.role === "user" && (
                <div style={{ background: "#03529d", borderRadius: "14px 4px 14px 14px", padding: "10px 14px", maxWidth: "80%", fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{msg.text}</div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #03529d, #1484d8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>✦</div>
              <div style={{ background: "#f0f5fa", borderRadius: "4px 14px 14px 14px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 0.18, 0.36].map((delay, i) => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#6b8db5", animation: `blink 1.2s ${delay}s infinite ease-in-out` }} />
                ))}
              </div>
            </div>
          )}

          {/* Suggested prompts — only show if just the welcome message */}
          {messages.length === 1 && !isTyping && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Try asking</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePrompt(p.text)}
                    style={{ background: "#fff", border: "1.5px solid #d0e4f5", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#1a2940", cursor: "pointer", textAlign: "left", display: "flex", gap: 8, alignItems: "center", transition: "border-color 0.12s, background 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#03529d"; e.currentTarget.style.background = "#f0f5fa"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0e4f5"; e.currentTarget.style.background = "#fff"; }}
                  >
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #e4eff9", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: "#f0f5fa", borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask about discussions, members, insights, events…"
              rows={1}
              style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: 13, color: "#1a2940", fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{ width: 38, height: 38, borderRadius: 10, background: input.trim() ? "#03529d" : "#d0e4f5", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim() ? "#fff" : "#8aadcc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() ? "#fff" : "#8aadcc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Footer disclaimer */}
        <div style={{ padding: "8px 18px", background: "#f7fafd", borderTop: "1px solid #e4eff9" }}>
          <div style={{ fontSize: 10, color: "#8aadcc", textAlign: "center", lineHeight: 1.5 }}>
            Responses are scoped to your permitted PATNA spaces. Admin-restricted data is never surfaced.
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardView({ onNavTo }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b8db5", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Tuesday, 10 March 2026</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#03529d", letterSpacing: "-0.3px" }}>Welcome back, Amara</h1>
          <p style={{ margin: "4px 0 0", color: "#6b8db5", fontSize: 13 }}>
            You have <strong style={{ color: "#03529d" }}>4 pending applications</strong> to review and <strong style={{ color: "#03529d" }}>7 unread discussions</strong>.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ background: "#fff", border: "1.5px solid #d0e4f5", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#03529d", cursor: "pointer" }}>◷ Upcoming Events</button>
          <button style={{ background: "#03529d", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>+ New Thread</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Policy Cohort Members", value: "34", sub: "+2 this month", icon: "◎" },
          { label: "Active Spaces", value: "4", sub: "3 with unread", icon: "⊡" },
          { label: "Applications Pending", value: "4", sub: "2 for Policy Cohort", icon: "◻", urgent: true },
          { label: "Insights Published", value: "12", sub: "3 tagged: Policy", icon: "✦" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)", borderTop: `3px solid ${stat.urgent ? "#e8400c" : "#03529d"}` }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.urgent ? "#e8400c" : "#03529d", letterSpacing: "-0.5px" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "#1a2940", fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 10, color: "#8aadcc", marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <section style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#03529d", letterSpacing: "0.02em", textTransform: "uppercase" }}>My Spaces</h2>
              <a href="#" style={{ fontSize: 11, color: "#6b8db5", textDecoration: "none", fontWeight: 600 }}>View All →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {SPACES.map(space => (
                <div key={space.name} style={{ border: "1.5px solid #e4eff9", borderRadius: 10, padding: "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: space.color }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a2940" }}>{space.name}</div>
                      <div style={{ fontSize: 10, color: "#8aadcc", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>{space.type}</div>
                    </div>
                    {space.role === "Lead" && <span style={{ fontSize: 9, background: "#03529d", color: "#b9e8fa", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Lead</span>}
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#6b8db5" }}>
                    <span>👥 {space.members}</span><span>💬 {space.threads}</span>
                    {space.unread > 0 && <span style={{ color: "#e8400c", fontWeight: 700 }}>● {space.unread} new</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#03529d", letterSpacing: "0.02em", textTransform: "uppercase" }}>Recent Discussions</h2>
              <a href="#" style={{ fontSize: 11, color: "#6b8db5", textDecoration: "none", fontWeight: 600 }}>All →</a>
            </div>
            {DISCUSSIONS.map((d, i) => (
              <div key={i} style={{ padding: "13px 0", borderBottom: i < DISCUSSIONS.length - 1 ? "1px solid #f0f5fa" : "none", display: "flex", gap: 12, cursor: "pointer" }}>
                {d.unread ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#03529d", marginTop: 5, flexShrink: 0 }} /> : <div style={{ width: 6, flexShrink: 0 }} />}
                <div>
                  <div style={{ fontWeight: d.unread ? 700 : 500, fontSize: 13, color: "#1a2940", marginBottom: 4 }}>{d.title}</div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#8aadcc" }}>
                    <span style={{ background: "#eef6ff", color: "#03529d", padding: "1px 7px", borderRadius: 4, fontWeight: 600 }}>{d.space}</span>
                    <span>{d.author}</span><span>{d.time}</span><span>💬 {d.replies}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)", borderTop: "3px solid #e8400c" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e8400c", letterSpacing: "0.02em", textTransform: "uppercase" }}>Applications — Your Review</h2>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8aadcc" }}>Recommend or add notes before Admin decides.</p>
              </div>
              <a href="#" style={{ fontSize: 11, color: "#6b8db5", textDecoration: "none", fontWeight: 600 }}>All →</a>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 10, color: "#8aadcc", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {["Applicant", "Country / Org", "Cohort", "Status", "Action"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 0", fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {APPLICATIONS.map((app, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f0f5fa" }}>
                    <td style={{ padding: "11px 0", fontWeight: 600, fontSize: 12 }}>{app.name}</td>
                    <td style={{ padding: "11px 0", color: "#6b8db5", fontSize: 12 }}>{app.country} · {app.org}</td>
                    <td style={{ padding: "11px 0" }}><span style={{ fontSize: 10, background: "#eef6ff", color: "#03529d", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{app.cohort}</span></td>
                    <td style={{ padding: "11px 0" }}><StatusPill status={app.status} /></td>
                    <td style={{ padding: "11px 0" }}><button style={{ fontSize: 11, background: "#f0f5fa", border: "none", borderRadius: 6, padding: "5px 12px", color: "#03529d", fontWeight: 600, cursor: "pointer" }}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "linear-gradient(135deg, #03529d 0%, #0a6bbf 100%)", borderRadius: 12, padding: "20px", boxShadow: "0 4px 16px rgba(3,82,157,0.25)", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(185,232,250,0.3)", border: "2px solid rgba(185,232,250,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#b9e8fa" }}>AD</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Dr. Amara Diallo</div>
                <div style={{ fontSize: 11, color: "rgba(185,232,250,0.8)" }}>Policy Adviser · Senegal</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {["Policy Cohort Lead", "SIDS", "IMO Negotiations", "Maritime Law"].map(tag => (
                <span key={tag} style={{ fontSize: 9, background: "rgba(185,232,250,0.18)", color: "#b9e8fa", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em", fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, borderTop: "1px solid rgba(185,232,250,0.2)", paddingTop: 14 }}>
              {[["4", "Spaces"], ["3", "Insights"], ["2", "Cohorts"]].map(([val, lbl]) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#b9e8fa" }}>{val}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <section style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#03529d", letterSpacing: "0.02em", textTransform: "uppercase" }}>Upcoming Events</h2>
            {EVENTS_DATA.filter(e => e.status === "upcoming").slice(0, 3).map((ev, i, arr) => (
              <div key={ev.id} style={{ display: "flex", gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: i < arr.length - 1 ? "1px solid #f0f5fa" : "none" }}>
                <div style={{ background: "#eef6ff", color: "#03529d", borderRadius: 8, padding: "6px 10px", textAlign: "center", flexShrink: 0, minWidth: 44 }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{ev.dateShort.split(" ")[0]}</div>
                  <div style={{ fontSize: 9, color: "#6b8db5" }}>{ev.dateShort.split(" ")[1] || ""}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12, color: "#1a2940" }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: "#8aadcc", marginTop: 2 }}>{ev.type} · {ev.location}</div>
                </div>
              </div>
            ))}
          </section>

          <section style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(3,82,157,0.07)" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#03529d", letterSpacing: "0.02em", textTransform: "uppercase" }}>Recent Insights</h2>
            {INSIGHTS.map((ins, i) => (
              <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < INSIGHTS.length - 1 ? "1px solid #f0f5fa" : "none", cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 9, background: "#eef6ff", color: "#03529d", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.07em" }}>{ins.type}</span>
                  <span style={{ fontSize: 10, color: "#8aadcc" }}>{ins.date}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2940", lineHeight: 1.4 }}>{ins.title}</div>
              </div>
            ))}
            <a href="#" style={{ fontSize: 11, color: "#03529d", textDecoration: "none", fontWeight: 600 }}>Browse Insights Hub →</a>
          </section>

          <section style={{ background: "#f0f5fa", borderRadius: 12, padding: "16px 18px" }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#6b8db5", letterSpacing: "0.1em", textTransform: "uppercase" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["◻ Review Applications", "#e8400c"],
                ["+ Start a Discussion", "#03529d"],
                ["◇ Propose New Content", "#03529d"],
                ["◈ View Member Directory", "#03529d"],
              ].map(([label, color]) => (
                <button key={label} onClick={() => label.includes("Directory") && onNavTo("Members")} style={{ background: "#fff", border: `1.5px solid ${color}22`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 600, color, cursor: "pointer", textAlign: "left" }}>{label}</button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default function PATNADashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f0f5fa", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", fontSize: 14, color: "#1a2940", overflow: "hidden" }}>

      <aside style={{ width: 220, background: "#03529d", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 16px rgba(3,82,157,0.18)" }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(185,232,250,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#b9e8fa", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#03529d" }}>P</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>PATNA</div>
              <div style={{ color: "#b9e8fa", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Initiative</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(185,232,250,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #b9e8fa 0%, #5ab3e8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#03529d", flexShrink: 0 }}>AD</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Dr. Amara Diallo</div>
              <div style={{ fontSize: 9, background: "rgba(185,232,250,0.2)", color: "#b9e8fa", padding: "2px 6px", borderRadius: 4, marginTop: 3, display: "inline-block", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Policy Lead</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => setActiveNav(item.label)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", background: activeNav === item.label ? "rgba(185,232,250,0.18)" : "transparent", border: "none", borderRadius: 8, color: activeNav === item.label ? "#b9e8fa" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, fontWeight: activeNav === item.label ? 600 : 400, marginBottom: 2, textAlign: "left", borderLeft: activeNav === item.label ? "3px solid #b9e8fa" : "3px solid transparent" }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <Badge count={item.badge} highlight={item.highlight} />}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(185,232,250,0.12)" }}>
          <div style={{ color: "rgba(185,232,250,0.5)", fontSize: 10, letterSpacing: "0.06em" }}>PLATFORM v1.0 MVP</div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
        {activeNav === "Dashboard" && <DashboardView onNavTo={setActiveNav} />}
        {activeNav === "Members" && <MembersView onNavTo={setActiveNav} />}
        {activeNav === "Events" && <EventsView />}
        {!["Dashboard", "Members", "Events"].includes(activeNav) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", color: "#8aadcc" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{NAV_ITEMS.find(n => n.label === activeNav)?.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#03529d", marginBottom: 8 }}>{activeNav}</div>
            <div style={{ fontSize: 13 }}>This section is coming in the next sprint.</div>
            <button onClick={() => setActiveNav("Dashboard")} style={{ marginTop: 20, background: "#03529d", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer" }}>← Back to Dashboard</button>
          </div>
        )}
      </main>

      {/* ── AI Chat FAB ── */}
      <AIChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      <button
        onClick={() => setChatOpen(o => !o)}
        title="PATNA Assistant"
        style={{
          position: "fixed", bottom: 28, right: 28,
          width: 52, height: 52, borderRadius: "50%",
          background: chatOpen ? "#b9e8fa" : "linear-gradient(135deg, #03529d 0%, #1484d8 100%)",
          border: chatOpen ? "2px solid #03529d" : "none",
          boxShadow: chatOpen ? "0 4px 16px rgba(3,82,157,0.2)" : "0 6px 24px rgba(3,82,157,0.35)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 310,
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          transform: chatOpen ? "rotate(15deg) scale(1.05)" : "scale(1)",
        }}
      >
        {chatOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#03529d" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.24 5.12 3.2 6.8L4 22l4.55-1.52C9.62 20.8 10.78 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2Z" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="8.5" cy="11" r="1.2" fill="#fff"/>
            <circle cx="12" cy="11" r="1.2" fill="#fff"/>
            <circle cx="15.5" cy="11" r="1.2" fill="#fff"/>
          </svg>
        )}
      </button>
    </div>
  );
}
