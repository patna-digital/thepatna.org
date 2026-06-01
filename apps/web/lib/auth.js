export function getSafeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/app";
  }

  return pathname.startsWith("/") ? pathname : "/app";
}

function buildAuthPath(basePath, nextPath = "/app") {
  const safePath = getSafeRedirectPath(nextPath);
  return `${basePath}?next=${encodeURIComponent(safePath)}`;
}

export function getAuthCallbackPath(nextPath = "/app") {
  return buildAuthPath("/auth/callback", nextPath);
}

export function getAuthVerifyPath(nextPath = "/app") {
  return buildAuthPath("/auth/verify", nextPath);
}

export function getAuthCallbackUrl(siteUrl, nextPath = "/app") {
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");
  return `${baseUrl}${getAuthCallbackPath(nextPath)}`;
}

export function getAuthVerifyUrl(siteUrl, nextPath = "/app") {
  const baseUrl = String(siteUrl || "").replace(/\/+$/, "");
  return `${baseUrl}${getAuthVerifyPath(nextPath)}`;
}
