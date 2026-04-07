import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/env";
// Note: Translation imports removed to avoid server-only module issues in client components

const ADMIN_PARTNERSHIP_LEAD_SELECT = `
  *,
  assigned_to_profile:profiles!partnership_leads_assigned_to_user_id_fkey(id, email, first_name, surname),
  updated_by_profile:profiles!partnership_leads_updated_by_user_id_fkey(id, email, first_name, surname)
`;

const ORG_TYPE_ORDER = {
  ngo: 0,
  government: 1,
  academic: 2,
  private: 3,
  foundation: 4,
  multilateral: 5,
};

function createPublicSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createPartnershipLeadSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function splitPartnershipLeadDetails(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalisePartnershipLeadRow(row) {
  return {
    ...row,
    org_type: String(row.org_type || "").toLowerCase(),
    status: String(row.status || "new").toLowerCase(),
  };
}

async function translatePartnershipLeadsForDisplay(partnershipLeads, locale) {
  // Stub implementation for MVP - return leads as-is
  return partnershipLeads;
}

export async function fetchPublicPartnershipLeads({ limit = 0 } = {}) {
  // Partnership leads are typically internal/admin facing
  return [];
}

export async function fetchAdminPartnershipLeads({ supabase }) {
  const { data, error } = await supabase
    .from("partnership_leads")
    .select(ADMIN_PARTNERSHIP_LEAD_SELECT)
    .order("created_at", { ascending: false });

  return {
    partnershipLeads: await translatePartnershipLeadsForDisplay(
      (data || []).map(normalisePartnershipLeadRow),
      "en", // Default locale for MVP
    ),
    error,
  };
}

export async function fetchAdminPartnershipLeadById({ leadId, supabase }) {
  const { data, error } = await supabase
    .from("partnership_leads")
    .select(ADMIN_PARTNERSHIP_LEAD_SELECT)
    .eq("id", leadId)
    .maybeSingle();

  return {
    partnershipLead: data ? normalisePartnershipLeadRow(data) : null,
    error,
  };
}

export function buildPartnershipLeadSummary(partnershipLeads) {
  const statusCounts = {};
  const orgTypeCounts = {};

  partnershipLeads.forEach((lead) => {
    statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    orgTypeCounts[lead.org_type] = (orgTypeCounts[lead.org_type] || 0) + 1;
  });

  return {
    total: partnershipLeads.length,
    new: statusCounts.new || 0,
    contacted: statusCounts.contacted || 0,
    inDiscussion: statusCounts.in_discussion || 0,
    proposalSent: statusCounts.proposal_sent || 0,
    negotiation: statusCounts.negotiation || 0,
    closedWon: statusCounts.closed_won || 0,
    closedLost: statusCounts.closed_lost || 0,
    ngo: orgTypeCounts.ngo || 0,
    government: orgTypeCounts.government || 0,
    academic: orgTypeCounts.academic || 0,
    private: orgTypeCounts.private || 0,
    foundation: orgTypeCounts.foundation || 0,
    multilateral: orgTypeCounts.multilateral || 0,
  };
}

export function filterAdminPartnershipLeads(partnershipLeads, { status = "all", orgType = "all", search = "" }) {
  const normalisedSearch = String(search || "").trim().toLowerCase();

  return partnershipLeads.filter((lead) => {
    if (status !== "all" && lead.status !== status) {
      return false;
    }

    if (orgType !== "all" && lead.org_type !== orgType) {
      return false;
    }

    if (!normalisedSearch) {
      return true;
    }

    const haystack = [
      lead.organisation,
      lead.name,
      lead.email,
      lead.focus_areas,
      lead.budget_range,
      lead.success_definition,
      lead.support_type,
      lead.org_type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalisedSearch);
  });
}

export function buildPartnershipLeadFormValues(lead) {
  if (!lead) {
    return {
      id: "",
      organisation: "",
      name: "",
      email: "",
      org_type: "",
      focus_areas: "",
      budget_range: "",
      status: "new",
      assigned_to_user_id: "",
      success_definition: "",
      support_type: "",
    };
  }

  return {
    id: lead.id,
    organisation: lead.organisation || "",
    name: lead.name || "",
    email: lead.email || "",
    org_type: lead.org_type || "",
    focus_areas: lead.focus_areas || "",
    budget_range: lead.budget_range || "",
    status: lead.status || "new",
    assigned_to_user_id: lead.assigned_to_user_id || "",
    success_definition: lead.success_definition || "",
    support_type: lead.support_type || "",
  };
}

export function formatCurrency(value) {
  if (!value) return "";
  
  // Simple currency formatting - in a real app, you'd use a proper currency library
  const numValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
  if (isNaN(numValue)) return value;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numValue);
}