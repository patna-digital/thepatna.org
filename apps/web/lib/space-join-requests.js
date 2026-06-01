const SPACE_JOIN_CONTEXT_PREFIX = "space_join_request:";

const REQUEST_DETAIL_LABELS = {
  category: "Request category",
  spaceId: "Space ID",
  spaceSlug: "Space Slug",
  spaceName: "Space Name",
  requesterUserId: "Requester User ID",
  requesterMessage: "Requester Message",
};

export function buildSpaceJoinRequestContext(spaceId) {
  const id = String(spaceId || "").trim();
  return id ? `${SPACE_JOIN_CONTEXT_PREFIX}${id}` : "";
}

export function isSpaceJoinRequestContext(value) {
  return String(value || "").trim().startsWith(SPACE_JOIN_CONTEXT_PREFIX);
}

export function buildSpaceJoinRequestDetails({
  message = "",
  requesterUserId = "",
  spaceId = "",
  spaceName = "",
  spaceSlug = "",
}) {
  return [
    `${REQUEST_DETAIL_LABELS.category}: space_join`,
    `${REQUEST_DETAIL_LABELS.spaceId}: ${String(spaceId || "").trim()}`,
    `${REQUEST_DETAIL_LABELS.spaceSlug}: ${String(spaceSlug || "").trim()}`,
    `${REQUEST_DETAIL_LABELS.spaceName}: ${String(spaceName || "").trim()}`,
    requesterUserId
      ? `${REQUEST_DETAIL_LABELS.requesterUserId}: ${String(requesterUserId || "").trim()}`
      : "",
    message
      ? `${REQUEST_DETAIL_LABELS.requesterMessage}: ${String(message || "").trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseSpaceJoinRequestDetails(details) {
  const parsed = {
    category: "",
    requesterMessage: "",
    requesterUserId: "",
    spaceId: "",
    spaceName: "",
    spaceSlug: "",
  };

  for (const rawLine of String(details || "").split("\n")) {
    const line = rawLine.trim();

    if (!line.includes(":")) {
      continue;
    }

    const [rawLabel, ...rawValue] = line.split(":");
    const label = rawLabel.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    switch (label) {
      case REQUEST_DETAIL_LABELS.category.toLowerCase():
        parsed.category = value;
        break;
      case REQUEST_DETAIL_LABELS.spaceId.toLowerCase():
        parsed.spaceId = value;
        break;
      case REQUEST_DETAIL_LABELS.spaceSlug.toLowerCase():
        parsed.spaceSlug = value;
        break;
      case REQUEST_DETAIL_LABELS.spaceName.toLowerCase():
        parsed.spaceName = value;
        break;
      case REQUEST_DETAIL_LABELS.requesterUserId.toLowerCase():
        parsed.requesterUserId = value;
        break;
      case REQUEST_DETAIL_LABELS.requesterMessage.toLowerCase():
        parsed.requesterMessage = value;
        break;
      default:
        break;
    }
  }

  return parsed;
}

export function isClosedSpaceJoinRequestStatus(status) {
  return String(status || "").trim().toLowerCase() === "closed";
}
