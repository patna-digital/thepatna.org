import { fetchMemberEvents } from "@/lib/events";
import { fetchMemberInsights } from "@/lib/insights";
import { fetchActiveMemberCounts, fetchMemberProfileView } from "@/lib/member-profiles";
import { fetchWorkspaceSpaces } from "@/lib/spaces";
import { ensureProfileRecord } from "@/lib/supabase/access";
import { fetchRecentThreadFeedBySpaces } from "@/lib/threads";

function getSpaceKindLabel(space) {
  if (space.kind) {
    return space.kind;
  }

  if (space.space_type) {
    return space.space_type;
  }

  if (space.type === "Cohort Space") {
    return "cohort";
  }

  if (space.type === "Constituency") {
    return "constituency";
  }

  return "working_group";
}

export function buildSidebarUser(member) {
  return {
    name: member.displayName,
    role: member.roleTitleDisplay || member.roleTitleLabel || member.role_title || "PATNA Member",
    organisation:
      member.organisationDisplay ||
      member.organisationLabel ||
      member.organisation_name ||
      member.countryDisplay ||
      member.country_of_residence ||
      "Community workspace",
    cohort: member.primaryCohort?.nameDisplay || member.primaryCohort?.name || "Member workspace",
    profileStatus: member.profileStatus,
    tags: member.domainTags.slice(0, 3).map((tag) => tag.nameDisplay || tag.name),
    headshotSrc: member.headshotSrc,
    initials: member.displayName
      .split(/\s+/)
      .map((part) => part[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  };
}

function parseEventDateBadge(event) {
  if (event.starts_at) {
    const parsed = new Date(event.starts_at);

    if (!Number.isNaN(parsed.getTime())) {
      return {
        month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(parsed).toUpperCase(),
        day: String(parsed.getUTCDate()),
      };
    }
  }

  const monthOnlyMatch = String(event.display_date || "").match(/^([A-Za-z]+) (\d{4})(?: \(TBC\))?$/i);

  if (monthOnlyMatch) {
    return {
      month: monthOnlyMatch[1].slice(0, 3).toUpperCase(),
      day: /tbc/i.test(event.display_date || "") ? "TBC" : "1",
    };
  }

  return {
    month: "TBD",
    day: "TBC",
  };
}

function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = timestamp - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }

  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }

  return rtf.format(Math.round(diffMs / day), "day");
}

function formatDashboardDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export async function fetchMemberWorkspaceFrameData({ supabase, userId }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isCurrentUser = user?.id === userId;

  if (isCurrentUser) {
    await ensureProfileRecord({ supabase, user });
  }

  let profileResult = await fetchMemberProfileView({ supabase, userId });

  if ((profileResult.error || !profileResult.member) && isCurrentUser) {
    await ensureProfileRecord({ supabase, user });
    profileResult = await fetchMemberProfileView({ supabase, userId });
  }

  if (profileResult.error || !profileResult.member) {
    return {
      error: profileResult.error || new Error("Member profile not found."),
      member: null,
      sidebarUser: null,
    };
  }

  return {
    error: null,
    member: profileResult.member,
    sidebarUser: buildSidebarUser(profileResult.member),
  };
}

export async function fetchMemberDashboardMainData({ adminClient, member, supabase, userId }) {
  const [countsResult, workspaceSpacesResult, insightsResult] = await Promise.all([
    adminClient
      ? fetchActiveMemberCounts({
          adminClient,
          cohortSlug: member.primaryCohort?.slug || "",
        })
      : Promise.resolve({
          error: null,
          totalActiveMembers: 0,
          cohortMemberCount: 0,
        }),
    fetchWorkspaceSpaces({ supabase, userId }),
    fetchMemberInsights({ supabase, filters: {} }),
  ]);

  const mySpaces = workspaceSpacesResult.memberSpaces || [];
  const availableSpaces = workspaceSpacesResult.availableSpaces || [];
  const joinedSpaceIds = mySpaces.map((space) => space.id).filter(Boolean);
  const recentThreadsResult = await fetchRecentThreadFeedBySpaces(supabase, joinedSpaceIds, { limit: 4 });
  const spaceById = new Map(mySpaces.map((space) => [space.id, space]));
  const unreadDiscussionCount = mySpaces.reduce((sum, space) => sum + Number(space.unread || 0), 0);
  const activeSpacesCount = mySpaces.length;
  const publishedInsightsCount = insightsResult.insights?.length || 0;

  return {
    error: countsResult.error || workspaceSpacesResult.error || null,
    stats: [
      {
        label: `${member.primaryCohort?.nameDisplay || member.primaryCohort?.name || "PATNA"} members`,
        value: countsResult.cohortMemberCount,
        note: `${countsResult.totalActiveMembers} active members in directory`,
        tone: "blue",
      },
      {
        label: "Active spaces",
        value: activeSpacesCount,
        note: `${mySpaces.filter((space) => space.unread > 0).length} spaces with updates`,
        tone: "blue",
      },
      {
        label: "Published insights",
        value: publishedInsightsCount,
        note: "Current shared library",
        tone: "blue",
      },
    ],
    mySpaces: mySpaces.map((space) => ({
      ...space,
      kind: getSpaceKindLabel(space),
      members: space.member_count ?? 0,
      summary: space.description || "",
    })),
    availableSpaces: availableSpaces.map((space) => ({
      ...space,
      kind: getSpaceKindLabel(space),
      members: space.member_count ?? 0,
      summary: space.description || "",
    })),
    recentDiscussions: (recentThreadsResult.threads || []).map((thread) => {
      const space = spaceById.get(thread.spaceId);

      return {
        id: thread.id,
        replies: thread.commentCount,
        space: space?.name || "Space",
        spaceSlug: space?.slug || "",
        timeAgo: formatRelativeTime(thread.createdAt),
        title: thread.title,
        author: thread.author?.name || "Member",
      };
    }),
    counts: {
      unreadDiscussions: unreadDiscussionCount,
    },
  };
}

export async function fetchMemberDashboardRailData({ supabase, member, userId = "" }) {
  const [memberEventsResult, insightsResult] = await Promise.all([
    fetchMemberEvents({ supabase, memberId: userId }),
    fetchMemberInsights({ supabase, filters: {} }),
  ]);
  const liveEvents = memberEventsResult.events || [];
  const upcomingEvents = liveEvents
    .filter((event) => ["upcoming", "tbc"].includes(event.schedule_status))
    .slice(0, 3)
    .map((event) => ({
      ...event,
      ...parseEventDateBadge(event),
    }));

  return {
    error: memberEventsResult.error,
    upcomingEvents,
    recentInsights: (insightsResult.insights || []).slice(0, 3).map((insight) => ({
      date: formatDashboardDate(insight.published_at),
      slug: insight.slug,
      title: insight.title,
      type: insight.contentTypeLabel || insight.content_type || "Insight",
    })),
    profileSnapshot: {
      role: member.roleTitleDisplay || member.roleTitleLabel || member.role_title || "PATNA Member",
      organisation:
        member.organisationDisplay ||
        member.organisationLabel ||
        member.organisation_name ||
        member.countryDisplay ||
        member.country_of_residence ||
        "Organisation pending",
      country: member.countryDisplay || member.country_of_residence || "Country pending",
      cohort: member.primaryCohort?.nameDisplay || member.primaryCohort?.name || "Cohort pending",
      tags: member.domainTags.slice(0, 4).map((tag) => tag.nameDisplay || tag.name),
      completionPercent: member.completionPercent,
      availability: member.availabilityStatus,
      profileStatus: member.profileStatus,
    },
  };
}

export function buildMemberDirectoryView({ currentUserId, members }) {
  const cohortOrder = ["policy", "academic", "industry", "civil-society"];
  const cohortsBySlug = new Map();
  const tagsBySlug = new Map();
  const countries = new Set();

  for (const member of members) {
    if (member.primaryCohort?.slug) {
      const existing = cohortsBySlug.get(member.primaryCohort.slug) || {
        slug: member.primaryCohort.slug,
        name: member.primaryCohort.nameDisplay || member.primaryCohort.name,
        count: 0,
      };
      existing.count += 1;
      cohortsBySlug.set(member.primaryCohort.slug, existing);
    }

    for (const tag of member.domainTags || []) {
      if (!tagsBySlug.has(tag.slug)) {
        tagsBySlug.set(tag.slug, { slug: tag.slug, name: tag.nameDisplay || tag.name });
      }
    }

    if (member.country_of_residence) {
      countries.add(
        JSON.stringify({
          value: member.country_of_residence,
          label: member.countryDisplay || member.country_of_residence,
        }),
      );
    }
  }

  return {
    currentUserId,
    members,
    summary: [...cohortsBySlug.values()].sort((left, right) => {
      const leftIndex = cohortOrder.indexOf(left.slug);
      const rightIndex = cohortOrder.indexOf(right.slug);

      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
      }

      return left.name.localeCompare(right.name);
    }),
    filters: {
      cohorts: [...cohortsBySlug.values()].sort((left, right) => {
        const leftIndex = cohortOrder.indexOf(left.slug);
        const rightIndex = cohortOrder.indexOf(right.slug);

        if (leftIndex !== -1 || rightIndex !== -1) {
          return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
        }

        return left.name.localeCompare(right.name);
      }),
      tags: [...tagsBySlug.values()].sort((left, right) => left.name.localeCompare(right.name)),
      countries: [...countries]
        .map((value) => JSON.parse(value))
        .sort((left, right) => left.label.localeCompare(right.label)),
    },
  };
}

export function buildMemberSpaceGroups(spaces) {
  const groups = new Map();

  for (const space of spaces) {
    const kind = getSpaceKindLabel(space);
    const existing = groups.get(kind) || [];
    groups.set(kind, [...existing, space]);
  }

  return [
    {
      id: "cohort",
      title: "Cohort spaces",
      subtitle: "Your primary coordination rooms and cohort-level updates.",
      spaces: groups.get("cohort") || [],
    },
    {
      id: "constituency",
      title: "Constituencies",
      subtitle: "Affinity or negotiation-alignment groups across the network.",
      spaces: groups.get("constituency") || [],
    },
    {
      id: "working_group",
      title: "Working groups",
      subtitle: "Focused taskforces and drafting spaces connected to live priorities.",
      spaces: groups.get("working_group") || [],
    },
    {
      id: "geography",
      title: "Geography spaces",
      subtitle: "Regional or country-linked spaces for place-based coordination.",
      spaces: groups.get("geography") || [],
    },
  ].filter((group) => group.spaces.length > 0);
}

export function buildApplicationSummary(applications) {
  const counts = {
    total: applications.length,
    submitted: 0,
    interviewing: 0,
  };

  for (const item of applications) {
    if (item.status === "submitted") {
      counts.submitted += 1;
    }

    if (item.status === "interviewing") {
      counts.interviewing += 1;
    }
  }

  return counts;
}
