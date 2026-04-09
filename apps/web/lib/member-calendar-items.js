export const MEMBER_CALENDAR_ITEM_SELECT = `
  id,
  member_id,
  item_type,
  title,
  notes,
  starts_at,
  ends_at,
  is_all_day,
  location,
  meeting_url,
  created_at,
  updated_at
`;

export function normaliseMemberCalendarItemType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["task", "meeting"].includes(normalized) ? normalized : "task";
}

export function transformMemberCalendarItems(items = []) {
  return items.map((item) => {
    const itemType = normaliseMemberCalendarItemType(item.item_type);

    return {
      ...item,
      item_type: itemType,
      summary: item.notes || null,
      description: null,
      event_source: "member_local",
      event_type_label: itemType === "meeting" ? "Meeting" : "Task",
      source_label: "My calendar",
      source_detail: null,
      is_rsvped: true,
      meeting_provider: item.meeting_url ? "link" : null,
    };
  });
}

export async function fetchMemberCalendarItems({ memberId, startDate, endDate, supabase }) {
  const { data, error } = await supabase
    .from("member_calendar_items")
    .select(MEMBER_CALENDAR_ITEM_SELECT)
    .eq("member_id", memberId)
    .gte("starts_at", `${startDate}T00:00:00`)
    .lte("starts_at", `${endDate}T23:59:59`)
    .order("starts_at", { ascending: true });

  return {
    items: data || [],
    error,
  };
}
