export function getSafeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return "/app";
  }

  return pathname.startsWith("/") ? pathname : "/app";
}
