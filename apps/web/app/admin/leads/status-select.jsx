"use client";

import { useRouter } from "next/navigation";

const STATUS_LABEL = {
  new:            "New",
  in_review:      "In Review",
  in_progress:    "In Progress",
  review:         "Under Review",
  active:         "Active",
  closed:         "Closed",
  contacted:      "Contacted",
  in_discussion:  "In Discussion",
  proposal_sent:  "Proposal Sent",
  negotiation:    "Negotiation",
  agreed:         "Agreed",
  closed_won:     "Won",
  completed:      "Completed",
  declined:       "Declined",
  closed_lost:    "Lost",
  cancelled:      "Cancelled",
};

export function LeadsStatusSelect({ statuses, current, source, search }) {
  const router = useRouter();

  function handleChange(e) {
    const params = new URLSearchParams();
    if (source && source !== "all") params.set("source", source);
    if (e.target.value !== "all") params.set("status", e.target.value);
    if (search) params.set("search", search);
    const q = params.toString();
    router.push(q ? `/admin/leads?${q}` : "/admin/leads");
  }

  return (
    <select className="filter-select" defaultValue={current} onChange={handleChange}>
      <option value="all">All statuses</option>
      {statuses.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s] || s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </option>
      ))}
    </select>
  );
}
