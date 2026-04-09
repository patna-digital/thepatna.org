function readEnv(name) {
  const value = process.env[name];

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function getSiteUrl() {
  return (readEnv("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000").replace(/\/+$/, "");
}

export function getSupabaseUrl() {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSupabaseProjectId() {
  return readEnv("SUPABASE_PROJECT_ID");
}

export function getGoogleTranslateApiKey() {
  return readEnv("GOOGLE_TRANSLATE_API_KEY");
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function isSupabaseAdminConfigured() {
  return Boolean(isSupabaseConfigured() && getSupabaseServiceRoleKey());
}

export function getAnthropicApiKey() {
  return readEnv("ANTHROPIC_API_KEY");
}
