const DATABASE_SCHEMA_ERROR_CODES = new Set([
  "42P01",
  "42703",
  "42501",
  "PGRST200",
  "PGRST202",
  "PGRST204",
]);

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function normalizeError(error) {
  if (!error) {
    return { message: "Unknown error" };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  if (typeof error === "object") {
    const normalized = {};

    for (const key of ["name", "message", "details", "hint", "code", "status", "statusCode"]) {
      const value = error[key];
      if (value !== undefined && value !== null && value !== "") {
        normalized[key] = value;
      }
    }

    if (Object.keys(normalized).length > 0) {
      return normalized;
    }

    const serialized = safeStringify(error);
    if (serialized) {
      return { message: serialized };
    }

    return { message: Object.prototype.toString.call(error) };
  }

  return { message: String(error) };
}

export function isMissingDatabaseFeatureError(error) {
  const normalized = normalizeError(error);
  const code = String(normalized.code || "");
  const message = [normalized.message, normalized.details, normalized.hint]
    .filter(Boolean)
    .join(" ");

  return (
    DATABASE_SCHEMA_ERROR_CODES.has(code) ||
    /does not exist|not exist|schema cache|could not find.*relationship|column .* does not exist|relation .* does not exist/i.test(
      message,
    )
  );
}

export function isDatabaseAccessError(error) {
  const normalized = normalizeError(error);
  const code = String(normalized.code || "");
  const message = [normalized.message, normalized.details, normalized.hint]
    .filter(Boolean)
    .join(" ");

  return (
    code === "42501" ||
    /permission denied|row-level security|violates row-level security/i.test(message)
  );
}
