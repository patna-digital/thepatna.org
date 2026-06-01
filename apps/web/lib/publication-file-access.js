export function isPublicationManager({ profile = null, roles = [] } = {}) {
  return (
    Boolean(profile?.is_super_admin) ||
    roles.includes("administrator") ||
    roles.includes("publisher")
  );
}

export function canAccessPublicationFile({
  contentItem,
  profile = null,
  roles = [],
  user = null,
} = {}) {
  if (!contentItem) {
    return false;
  }

  if (isPublicationManager({ profile, roles })) {
    return true;
  }

  if (contentItem.publish_status !== "published") {
    return false;
  }

  if (contentItem.visibility === "public") {
    return true;
  }

  if (contentItem.visibility === "members") {
    return Boolean(user?.id);
  }

  return false;
}
