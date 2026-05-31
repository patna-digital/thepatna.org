import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
// Note: Translation imports removed to avoid server-only module issues in client components

const ADMIN_COLLABORATION_LEAD_SELECT = `
  *,
  assigned_to_profile:profiles!collaboration_leads_assigned_to_user_id_fkey(id, email, first_name, surname),
  updated_by_profile:profiles!collaboration_leads_updated_by_user_id_fkey(id, email, first_name, surname)
`;

const COLLABORATION_TYPE_ORDER = {
  research: 0,
  content: 1,
  events: 2,
  training: 3,
  advocacy: 4,
  technical: 5,
};

function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createCollaborationLeadSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitCollaborationLeadDetails(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normaliseCollaborationLeadRow(row) {
  return {
    ...row,
    collaboration_type: String(row.collaboration_type || "").toLowerCase(),
    status: String(row.status || "new").toLowerCase(),
  };
}

async function translateCollaborationLeadsForDisplay(collaborationLeads, locale) {
  // Stub implementation for MVP - return leads as-is
  return collaborationLeads;
}

export async function fetchPublicCollaborationLeads({ limit = 0 } = {}) {
  // Collaboration leads are typically internal/admin facing
  return [];
}

export async function fetchAdminCollaborationLeads({ supabase }) {
  const { data, error } = await supabase
    .from("collaboration_leads")
    .select(ADMIN_COLLABORATION_LEAD_SELECT)
    .order("created_at", { ascending: false });

  return {
    collaborationLeads: await translateCollaborationLeadsForDisplay(
      (data || []).map(normaliseCollaborationLeadRow),
      "en", // Default locale for MVP
    ),
    error,
  };
}

export async function fetchAdminCollaborationLeadById({ leadId, supabase }) {
  const { data, error } = await supabase
    .from("collaboration_leads")
    .select(ADMIN_COLLABORATION_LEAD_SELECT)
    .eq("id", leadId)
    .maybeSingle();

  return {
    collaborationLead: data ? normaliseCollaborationLeadRow(data) : null,
    error,
  };
}

export function buildCollaborationLeadSummary(collaborationLeads) {
  const statusCounts = {};
  const collabTypeCounts = {};

  collaborationLeads.forEach((lead) => {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    collabTypeCounts[lead.collaboration_type] = (collabTypeCounts[lead.collaboration_type] || 0) + 1;
  });

  return {
    total: collaborationLeads.length,
    new: statusCounts.new || 0,
    contacted: statusCounts.contacted || 0,
    inDiscussion: statusCounts.in_discussion || 0,
    proposalSent: statusCounts.proposal_sent || 0,
    negotiation: statusCounts.negotiation || 0,
    agreed: statusCounts.agreed || 0,
    declined: statusCounts.declined || 0,
    research: collabTypeCounts.research || 0,
    content: collabTypeCounts.content || 0,
    events: collabTypeCounts.events || 0,
    training: collabTypeCounts.training || 0,
    advocacy: collabTypeCounts.advocacy || 0,
    technical: collabTypeCounts.technical || 0,
  };
}

export function filterAdminCollaborationLeads(collaborationLeads, { status = "all", collabType = "all", search = "", sortBy = "created_at", sortDir = "desc" }) {
  const normalisedSearch = String(search || "").trim().toLowerCase();

  const filtered = collaborationLeads.filter((lead) => {
    if (status !== "all" && lead.status !== status) return false;
    if (collabType !== "all" && lead.collaboration_type !== collabType) return false;
    if (!normalisedSearch) return true;

    const haystack = [lead.organisation, lead.name, lead.email, lead.proposal, lead.collaboration_type]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalisedSearch);
  });

  const VALID_SORT_COLS = ["organisation", "collaboration_type", "status", "created_at"];
  const col = VALID_SORT_COLS.includes(sortBy) ? sortBy : "created_at";
  const asc = sortDir === "asc";

  return [...filtered].sort((a, b) => {
    const av = String(a[col] || "").toLowerCase();
    const bv = String(b[col] || "").toLowerCase();
    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

export function buildCollaborationLeadFormValues(lead) {
  if (!lead) {
    return {
      id: "",
      organisation: "",
      name: "",
      email: "",
      collaboration_type: "",
      proposal: "",
      status: "new",
      assigned_to_user_id: "",
    };
  }

  return {
    id: lead.id,
    organisation: lead.organisation || "",
    name: lead.name || "",
    email: lead.email || "",
    collaboration_type: lead.collaboration_type || "",
    proposal: lead.proposal || "",
    status: lead.status || "new",
    assigned_to_user_id: lead.assigned_to_user_id || "",
  };
}