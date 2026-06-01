import { formatDistanceToNow } from "date-fns";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function TargetChip({ broadcast }) {
  if (broadcast.target_type === "all") return <span className="status-chip chip-neutral">All members</span>;
  if (broadcast.target_type === "cohort") return <span className="status-chip chip-new">By cohort</span>;
  return <span className="status-chip chip-muted">Selected</span>;
}

function ChannelChips({ channels }) {
  return (
    <span style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {(channels || []).map((c) => (
        <span className="status-chip chip-muted" key={c} style={{ fontSize: "11px" }}>
          {c === "email" ? "✉ Email" : "🔔 In-app"}
        </span>
      ))}
    </span>
  );
}

export function BroadcastHistory({ broadcasts }) {
  if (!broadcasts?.length) {
    return (
      <div className="admin-empty-state">
        <p>No broadcasts sent yet. Use the button above to send your first announcement.</p>
      </div>
    );
  }

  return (
    <div className="broadcasts-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Target</th>
            <th>Channels</th>
            <th>Recipients</th>
            <th>Sent</th>
            <th>Sender</th>
          </tr>
        </thead>
        <tbody>
          {broadcasts.map((b) => {
            const senderName = b.sender
              ? [b.sender.first_name, b.sender.surname].filter(Boolean).join(" ")
              : "—";

            return (
              <tr key={b.id}>
                <td>
                  <span style={{ fontWeight: 600 }}>{b.subject}</span>
                  {b.body && (
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ink-muted)", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.body}
                    </p>
                  )}
                </td>
                <td><TargetChip broadcast={b} /></td>
                <td><ChannelChips channels={b.delivery_channels} /></td>
                <td>{b.recipient_count > 0 ? b.recipient_count : "—"}</td>
                <td>
                  <span title={formatDate(b.sent_at)} style={{ fontSize: "13px" }}>
                    {b.sent_at ? formatDate(b.sent_at) : <span className="status-chip chip-warning">Pending</span>}
                  </span>
                </td>
                <td style={{ fontSize: "13px", color: "var(--ink-muted)" }}>{senderName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
