export function getSafeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/app";
  }

  return pathname.startsWith("/") ? pathname : "/app";
}

export function getAuthCallbackPath(nextPath = "/app") {
  const safePath = getSafeRedirectPath(nextPath);
  return `/auth/callback?next=${encodeURIComponent(safePath)}`;
}

export function getAuthCallbackUrl(siteUrl, nextPath = "/app") {
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");
  return `${baseUrl}${getAuthCallbackPath(nextPath)}`;
}
